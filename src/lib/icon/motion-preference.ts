import { Injectable, signal } from '@angular/core';

const query = '(prefers-reduced-motion: reduce)';

@Injectable({ providedIn: 'root' })
export class UaMotionPreference {
  readonly reduced = signal(false);

  constructor() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia(query);
    this.reduced.set(media.matches);
    media.addEventListener('change', () => this.reduced.set(media.matches));
  }
}
