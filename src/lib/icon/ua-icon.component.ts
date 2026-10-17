import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';

import type { UaAnimation, UaInteraction } from '../core/animation';
import { endHover, isHover, replay, startHover, toggle, type UaPlayer } from '../core/interactions';
import { UaIconRegistry } from './icon-registry';
import { UaMotionPreference } from './motion-preference';
import { loadAnimation, type Player } from '../core/player';

/**
 * Angular host for a useAnimations icon.
 *
 * The SVG player is deliberately kept outside Angular's change-detection zone. The component owns
 * declarative inputs and interaction state; the renderer owns SVG frames.
 */
@Component({
  selector: 'ua-icon',
  standalone: true,
  template: '',
  styles: [
    `:host{display:inline-block;flex-shrink:0;overflow:hidden;line-height:0}`,
    `:host svg{width:100%;height:100%;display:block}`,
    `:where([data-ua-icon] path[stroke^="rgb"]:not([stroke="rgb(255,255,255)"])){stroke:var(--ua-stroke,currentColor)}`,
    `:where([data-ua-icon] path[fill="rgb(0,0,0)"]){fill:var(--ua-fill,var(--ua-stroke,currentColor))}`,
    `:where([data-ua-icon] path[stroke="rgb(255,255,255)"]){stroke:var(--ua-knockout,Canvas)}`,
    `:where([data-ua-icon] path[fill="rgb(255,255,255)"]){fill:var(--ua-knockout,Canvas)}`,
  ],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[style.width]': 'cssSize()',
    '[style.height]': 'cssSize()',
    '[style.color]': 'color()',
    '[style.--ua-stroke]': 'strokeColor() || color()',
    '[style.--ua-fill]': 'fillColor() || strokeColor() || color()',
    '[attr.data-ua-icon]': '""',
    '[attr.role]': 'isClickInteractive() ? "button" : accessibleText() ? "img" : null',
    '[attr.aria-hidden]': 'accessibleText() ? null : "true"',
    '[attr.aria-label]': 'accessibleText() || null',
    '[attr.aria-pressed]': 'isToggle() ? active() : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.tabindex]': 'isKeyboardInteractive() && !disabled() ? 0 : null',
    '(click)': 'onClick()',
    '(keydown)': 'onKeydown($event)',
    '(pointerenter)': 'onPointerEnter($event.pointerType)',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(focusin)': 'onFocus()',
    '(focusout)': 'onMouseLeave()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UaIconComponent {
  /** A registered icon name, such as `bell` or `heart`. */
  readonly icon = input<string>();
  /** An inline custom Lottie animation. Takes precedence over `icon`. */
  readonly animation = input<UaAnimation>();
  readonly interaction = input<UaInteraction>();
  /** Controlled end state for click-toggle animations. */
  readonly active = input(false);
  /** Emits the next state after a click-toggle interaction, enabling `[(active)]`. */
  readonly activeChange = output<boolean>();
  readonly size = input<number | string>(24);
  readonly color = input<string>('currentColor');
  readonly strokeColor = input<string>();
  readonly fillColor = input<string>();
  readonly speed = input(1);
  /** Desired whole-animation duration in milliseconds or CSS-like `"350ms"` / `"0.5s"`. */
  readonly duration = input<number | string>();
  readonly loop = input<boolean | number>();
  readonly autoplay = input<boolean>();
  readonly ariaLabel = input<string>('');
  readonly disabled = input(false);

  readonly complete = output<void>();
  readonly loopComplete = output<void>();
  readonly error = output<Error>();

  protected readonly cssSize = computed(() => {
    // `size` is also a native HTMLElement property. Read the static attribute as a fallback so
    // `<ua-icon size="32">` remains as pleasant as `[size]="32"` in Angular templates.
    const nativeSize = this.element.nativeElement.getAttribute('size');
    const size = this.size() === 24 && nativeSize ? nativeSize : this.size();
    return typeof size === 'number' ? `${size}px` : size;
  });
  protected readonly ariaText = computed(
    () => this.ariaLabel() || this.element.nativeElement.getAttribute('aria-label') || ''
  );
  protected readonly isToggle = computed(() => this.currentInteraction() === 'click-toggle');
  protected readonly isClickInteractive = computed(() => {
    const interaction = this.currentInteraction();
    return interaction === 'click-replay' || interaction === 'click-toggle';
  });
  protected readonly isKeyboardInteractive = computed(() => {
    const interaction = this.currentInteraction();
    return this.isClickInteractive() || isHover(interaction);
  });
  protected readonly accessibleText = computed(
    () => this.ariaText() || (this.isKeyboardInteractive() ? this.icon() || 'Animated icon' : '')
  );

  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly registry = inject(UaIconRegistry);
  private readonly motion = inject(UaMotionPreference);
  private readonly zone = inject(NgZone);
  private readonly mounted = signal(false);
  private readonly playerGeneration = signal(0);
  private player: UaPlayer | undefined;
  private stopAfterCycle = false;
  private atEnd = false;
  private lastPointerType = '';

  constructor() {
    effect((onCleanup) => {
      const animation = this.animation() ?? (this.icon() ? this.registry.get(this.icon()!) : undefined);
      if (!animation && (this.icon() || this.animation())) {
        this.error.emit(new Error(`ng-useanimations: icon \"${this.icon()}\" is not registered.`));
      }
      const interaction = this.interaction() ?? animation?.interaction ?? 'click-replay';
      const reduced = this.motion.reduced();
      const loop = this.loop() ?? (interaction === 'loop' || interaction === 'hover-loop');
      const autoplay = this.autoplay() ?? (interaction === 'loop' && !reduced);
      if (!this.mounted() || !animation) return;

      let created: Player;
      let observer: IntersectionObserver | undefined;
      this.zone.runOutsideAngular(() => {
        try {
          created = loadAnimation({
            container: this.element.nativeElement,
            animationData: animation.animationData,
            loop,
            autoplay,
          });
          this.player = created;
          this.atEnd = interaction === 'click-toggle' && untracked(this.active);
          if (this.atEnd) created.goToAndStop(created.totalFrames - 1);
          created.addEventListener('complete', () => this.onComplete(created));
          created.addEventListener('loopComplete', () => this.onLoopComplete(created));
          if (autoplay && typeof IntersectionObserver !== 'undefined') {
            observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? created.play() : created.pause()));
            observer.observe(this.element.nativeElement);
          }
          this.playerGeneration.update((value) => value + 1);
        } catch (cause) {
          const exception = cause instanceof Error ? cause : new Error(String(cause));
          this.zone.run(() => this.error.emit(exception));
        }
      });
      onCleanup(() => {
        observer?.disconnect();
        created?.destroy();
        if (this.player === created) this.player = undefined;
      });
    });
    effect(() => {
      this.playerGeneration();
      const player = this.player;
      if (!player) return;
      const duration = parseDuration(this.duration());
      const speed = duration && duration > 0 ? timelineDuration(this.currentAnimation()?.animationData) / duration : this.speed();
      player.setSpeed(speed);
    });
    effect(() => {
      this.playerGeneration();
      const player = this.player;
      if (!player || this.currentInteraction() !== 'click-toggle') return;
      const active = this.active();
      if (active === this.atEnd) return;
      this.atEnd = active;
      toggle(player, active, this.motion.reduced());
    });
    afterNextRender(() => this.mount());
  }

  /** Starts playback. Safe to call before the SVG player mounts. */
  play(): void {
    this.player?.play();
  }

  pause(): void {
    this.player?.pause();
  }

  reset(): void {
    this.player?.goToAndStop(0);
  }

  protected onClick(): void {
    this.triggerClickInteraction();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (!this.isClickInteractive() || this.disabled()) return;
    event.preventDefault();
    this.triggerClickInteraction();
  }

  private triggerClickInteraction(): void {
    const player = this.player;
    if (!player || this.disabled()) return;
    const interaction = this.currentInteraction();
    if (interaction === 'click-replay' && !this.motion.reduced()) {
      replay(player);
      return;
    }
    if (interaction === 'click-toggle') {
      const next = !this.atEnd;
      this.atEnd = next;
      toggle(player, next, this.motion.reduced());
      this.zone.run(() => this.activeChange.emit(next));
    }
  }

  protected onMouseEnter(): void {
    const player = this.player;
    const interaction = this.currentInteraction();
    if (
      !this.disabled() &&
      this.lastPointerType !== 'touch' &&
      player &&
      isHover(interaction) &&
      !this.motion.reduced()
    ) {
      startHover(player, interaction);
    }
  }

  protected onPointerEnter(pointerType: string): void {
    this.lastPointerType = pointerType;
  }

  protected onMouseLeave(): void {
    const player = this.player;
    const interaction = this.currentInteraction();
    if (!this.disabled() && player && isHover(interaction) && !this.motion.reduced()) {
      this.stopAfterCycle = endHover(player, interaction);
    }
  }

  protected onFocus(): void {
    this.onMouseEnter();
  }

  private currentAnimation(): UaAnimation | undefined {
    return this.animation() ?? (this.icon() ? this.registry.get(this.icon()!) : undefined);
  }

  private currentInteraction(): UaInteraction {
    return this.interaction() ?? this.currentAnimation()?.interaction ?? 'click-replay';
  }

  private mount(): void {
    this.mounted.set(true);
  }

  private onComplete(created: Player): void {
    if (this.stopAfterCycle) {
      this.stopAfterCycle = false;
      created.goToAndStop(0);
    }
    this.zone.run(() => this.complete.emit());
  }

  private onLoopComplete(created: Player): void {
    if (this.stopAfterCycle) {
      this.stopAfterCycle = false;
      created.goToAndStop(0);
    }
    this.zone.run(() => this.loopComplete.emit());
  }
}

const parseDuration = (value: number | string | undefined): number | undefined => {
  if (typeof value === 'number') return value;
  if (!value) return undefined;
  const match = /^([0-9]+(?:\.[0-9]+)?)(ms|s)?$/.exec(value.trim());
  if (!match) return undefined;
  return Number(match[1]) * (match[2] === 's' ? 1000 : 1);
};

const timelineDuration = (data: object | undefined): number => {
  const timeline = data as { fr?: unknown; ip?: unknown; op?: unknown } | undefined;
  const frameRate = typeof timeline?.fr === 'number' ? timeline.fr : 0;
  const first = typeof timeline?.ip === 'number' ? timeline.ip : 0;
  const last = typeof timeline?.op === 'number' ? timeline.op : 0;
  return frameRate > 0 && last > first ? ((last - first) / frameRate) * 1000 : 1000;
};
