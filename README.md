<p align="center">
  <img src="./assets/ng-useanimations.svg" width="72" alt="ng-useanimations logo" />
</p>

<h1 align="center">ng-useanimations</h1>

✨ Animated SVG icons for Angular web apps and Ionic mobile apps.

> **Beta — under active development.** APIs may change before `v1.0.0`.

The original icon collection is available at [useanimations.com](https://useanimations.com/).

## Installation

```sh
npm install ng-useanimations
```

## Requirements

- **Angular 17.1 or newer**
- **Ionic Angular** projects are supported when they use Angular 17.1 or newer.

## Quick start

Register only the icons your app uses in `app.config.ts`:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideUseAnimationIcons } from 'ng-useanimations';
import { bell, heart } from 'ng-useanimations/icons';

export const appConfig: ApplicationConfig = {
  providers: [provideUseAnimationIcons([bell, heart])],
};
```

Then import `UaIconComponent` in any standalone component and use the custom tag:

```ts
import { Component } from '@angular/core';
import { UaIconComponent } from 'ng-useanimations';

@Component({
  selector: 'app-example',
  imports: [UaIconComponent],
  template: `
    <ua-icon icon="bell" size="32" color="#4f46e5" />
    <ua-icon icon="heart" interaction="hover" size="32" />
  `,
})
export class ExampleComponent {}
```

The same component works in Ionic Angular pages. Import it in the page component, register the
icons once in `app.config.ts`, then use `<ua-icon>` in the Ionic template.

## Built with

- **Angular standalone components** — Angular 17+ and Ionic Angular compatible.
- **TypeScript** — typed icon definitions and public API.
- **Native SVG animation player** — renders the useAnimations Lottie data directly as SVG.
- **Tree-shakable icon entry point** — import only the icons your app needs.

## Options

| Input | Example | Purpose |
| --- | --- | --- |
| `icon` | `icon="bell"` | Registered icon name. |
| `size` | `size="32"` | Icon width and height in pixels, or a CSS value such as `"2rem"`. |
| `color` | `color="#4f46e5"` | Main SVG color. |
| `interaction` | `interaction="hover"` | Animation behaviour. |
| `duration` | `duration="500ms"` | Duration of one animation cycle. |
| `loop` | `[loop]="true"` | Repeats the animation. |
| `ariaLabel` | `ariaLabel="Notifications"` | Accessible label for the icon. |

## Interaction examples

```html
<!-- Replays when clicked (the default for most icons) -->
<ua-icon icon="bell" interaction="click-replay" />

<!-- Plays while the pointer is over it -->
<ua-icon icon="heart" interaction="hover" color="crimson" />

<!-- Runs continuously -->
<ua-icon icon="loading" interaction="loop" size="28" />

<!-- Two-way toggle state -->
<ua-icon icon="heart" interaction="click-toggle" [(active)]="liked" />
```

Available interactions are `click-replay`, `click-toggle`, `hover`, `hover-replay`, `hover-loop`,
and `loop`.

## Icons

Browse the original icon collection at [useanimations.com](https://useanimations.com/), then import
the matching camelCase icon from `ng-useanimations/icons` (for example: `bell`, `heart`, or
`loading`).
