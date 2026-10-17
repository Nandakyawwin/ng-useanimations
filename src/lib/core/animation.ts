/** The supported interaction behaviours for an animated icon. */
export type UaInteraction =
  | 'loop'
  | 'click-toggle'
  | 'click-replay'
  | 'hover'
  | 'hover-loop'
  | 'hover-replay';

/** A self-contained Lottie animation, optionally with a default interaction. */
export interface UaAnimation {
  readonly animationData: object;
  readonly interaction?: UaInteraction;
}

/** An animation that can be registered under an HTML-friendly name. */
export interface UaIcon extends UaAnimation {
  readonly name: string;
}
