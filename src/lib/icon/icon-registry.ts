import { Injectable, InjectionToken, inject } from '@angular/core';

import type { UaIcon } from '../core/animation';

export const UA_ICONS = new InjectionToken<readonly (readonly UaIcon[])[]>('UA_ICONS', {
  factory: () => [],
});

@Injectable({ providedIn: 'root' })
export class UaIconRegistry {
  private readonly icons = new Map<string, UaIcon>(
    inject(UA_ICONS).reduce<readonly UaIcon[]>((all, group) => [...all, ...group], []).map((icon) => [
      icon.name,
      icon,
    ])
  );

  get(name: string): UaIcon | undefined {
    return this.icons.get(name);
  }
}
