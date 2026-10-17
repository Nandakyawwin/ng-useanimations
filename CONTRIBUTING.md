# Contributing

## Local setup

```bash
npm install
npm run typecheck
npm test
npm run build
```

The repository intentionally keeps publish output out of Git. `npm run build` writes the package to
`dist/ng-useanimations`; `npm run pack` validates the exact tarball that would be published.

## Architecture

- `src/lib/core` is framework-independent playback and interaction logic.
- `src/lib/icon` is the small Angular adapter and icon registry.
- `icons` is the `ng-useanimations/icons` secondary entry point. It contains one generated module
  per animation so an app can register only the icons it uses.

Do not add an icon to the primary `ng-useanimations` entry point: doing so would make every app load
the entire collection.

## Updating imported assets

The player and icon animations are derived from useAnimations under MIT. With a local checkout of
the upstream repository, run:

```bash
node scripts/import-upstream.mjs <path-to-react-useanimations>
npm run typecheck
npm test
npm run build
```

Keep `THIRD_PARTY_NOTICES.md` intact. The importer regenerates it from the upstream licence.
