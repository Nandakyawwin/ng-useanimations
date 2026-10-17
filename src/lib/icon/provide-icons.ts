import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import type { UaIcon } from '../core/animation';
import { UA_ICONS } from './icon-registry';

/** Registers only the icons an application uses, keeping bundles tree-shakable. */
export const provideUseAnimationIcons = (icons: readonly UaIcon[]): EnvironmentProviders =>
  makeEnvironmentProviders([{ provide: UA_ICONS, multi: true, useValue: icons }]);
