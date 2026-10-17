import type { UaInteraction } from './animation';

export interface UaPlayer {
  readonly totalFrames: number;
  readonly isPaused: boolean;
  play(): void;
  pause(): void;
  setDirection(direction: 1 | -1): void;
  setSpeed(speed: number): void;
  playSegments(segment: readonly [number, number]): void;
  goToAndStop(frame: number): void;
}

export const isHover = (interaction: UaInteraction) => interaction.startsWith('hover');

export const replay = (player: UaPlayer) => {
  player.setDirection(1);
  player.playSegments([0, player.totalFrames]);
};

export const toggle = (player: UaPlayer, active: boolean, reducedMotion: boolean) => {
  if (reducedMotion) return player.goToAndStop(active ? player.totalFrames - 1 : 0);
  player.setDirection(active ? 1 : -1);
  player.play();
};

export const startHover = (player: UaPlayer, interaction: UaInteraction) => {
  if (interaction === 'hover-replay') {
    if (player.isPaused) replay(player);
    return;
  }
  player.setDirection(1);
  player.play();
};

/** Returns true when a hover-loop should stop at its next completed cycle. */
export const endHover = (player: UaPlayer, interaction: UaInteraction) => {
  if (interaction === 'hover') {
    player.setDirection(-1);
    player.play();
    return false;
  }
  if (interaction === 'hover-loop') {
    if (player.isPaused) player.goToAndStop(0);
    return !player.isPaused;
  }
  return false;
};
