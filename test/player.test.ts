// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { endHover, replay, startHover, toggle, type UaPlayer } from '../src/lib/core/interactions';
import { loadAnimation } from '../src/lib/core/player';
import { bell, menu, notification } from '../icons';
import * as icons from '../icons';

describe('SVG player', () => {
  it.each([bell, notification, menu])('renders $name as SVG paths', (icon) => {
    const host = document.createElement('span');
    const player = loadAnimation({ container: host, animationData: icon.animationData });
    expect(host.querySelector('svg')).not.toBeNull();
    expect(host.querySelectorAll('path').length).toBeGreaterThan(0);
    player.destroy();
    expect(host.querySelector('svg')).toBeNull();
  });
});

describe('icon collection', () => {
  const animations = Object.values(icons).filter(
    (value): value is { name: string; animationData: object } =>
      Boolean(value) && typeof value === 'object' && 'animationData' in value
  );

  it('contains the complete upstream set plus the bell alias', () => {
    expect(animations).toHaveLength(301);
  });

  it.each(animations)('$name has renderable initial SVG content', (icon) => {
    const host = document.createElement('span');
    const player = loadAnimation({ container: host, animationData: icon.animationData });
    expect(host.querySelector('svg path')).not.toBeNull();
    player.destroy();
  });
});

class FakePlayer implements UaPlayer {
  totalFrames = 60;
  isPaused = true;
  direction: 1 | -1 = 1;
  calls: string[] = [];
  play() { this.calls.push(`play:${this.direction}`); this.isPaused = false; }
  pause() { this.isPaused = true; }
  setDirection(direction: 1 | -1) { this.direction = direction; }
  setSpeed(speed: number) { this.calls.push(`speed:${speed}`); }
  playSegments(segment: readonly [number, number]) { this.calls.push(`segment:${segment.join('-')}`); }
  goToAndStop(frame: number) { this.calls.push(`frame:${frame}`); this.isPaused = true; }
}

describe('interaction state machine', () => {
  it('replays, toggles, and completes hover interactions predictably', () => {
    const player = new FakePlayer();
    replay(player);
    toggle(player, true, false);
    startHover(player, 'hover');
    expect(endHover(player, 'hover')).toBe(false);
    expect(player.calls).toEqual(['segment:0-60', 'play:1', 'play:1', 'play:-1']);
  });

  it('uses an immediate frame change for reduced-motion toggles', () => {
    const player = new FakePlayer();
    toggle(player, true, true);
    expect(player.calls).toEqual(['frame:59']);
  });
});
