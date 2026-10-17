// Derived from useAnimations (MIT), Copyright (c) 2018-2026 useAnimations.
// See THIRD_PARTY_NOTICES.md for the full notice.

export type UaInteraction = 'loop' | 'click-toggle' | 'click-replay' | 'hover' | 'hover-loop' | 'hover-replay';

export interface UaIcon { readonly name: string; readonly interaction: UaInteraction; readonly animationData: object; }
