/*
 * One-time, repeatable importer for the MIT-licensed useAnimations source set.
 * Usage: node scripts/import-upstream.mjs <path-to-react-useanimations>
 *
 * It deliberately produces framework-neutral player files and self-contained TypeScript icon
 * modules. Nothing in the published package reads the source repository at runtime.
 */
import { cpSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const source = process.argv[2] && resolve(process.argv[2]);
if (!source) throw new Error('Usage: node scripts/import-upstream.mjs <react-useanimations-path>');

const playerSource = join(source, 'src', 'player');
const iconSource = join(source, 'icons');
const destination = resolve('src/lib');
const playerDestination = join(destination, 'core', 'player');
const iconDestination = resolve('icons');
const header = `// Derived from useAnimations (MIT), Copyright (c) 2018-2026 useAnimations.\n// See THIRD_PARTY_NOTICES.md for the full notice.\n\n`;

mkdirSync(playerDestination, { recursive: true });
for (const file of readdirSync(playerSource).filter((file) => file.endsWith('.ts'))) {
  const code = readFileSync(join(playerSource, file), 'utf8')
    .replaceAll('react-useanimations:', 'ng-useanimations:');
  writeFileSync(join(playerDestination, file), header + code);
}

const catalog = JSON.parse(readFileSync(join(iconSource, 'catalog.json'), 'utf8'));
mkdirSync(iconDestination, { recursive: true });
const exportName = (name) => (name === 'delete' || name === 'package' ? `${name}Icon` : name);
const expectedIconFiles = new Set([
  'bell.ts',
  'index.ts',
  'types.ts',
  'ng-package.json',
  ...catalog.map((icon) => `${icon.name}.ts`),
]);

// Keep the canonical icon directory in sync when upstream removes or renames an icon.
for (const file of readdirSync(iconDestination).filter((entry) => entry.endsWith('.ts') && !expectedIconFiles.has(entry))) {
  const target = join(iconDestination, file);
  if (!readFileSync(target, 'utf8').startsWith(header.trim())) {
    throw new Error(`Refusing to remove non-generated icon file: ${target}`);
  }
  unlinkSync(target);
}
writeFileSync(
  join(iconDestination, 'types.ts'),
  `${header}export type UaInteraction = 'loop' | 'click-toggle' | 'click-replay' | 'hover' | 'hover-loop' | 'hover-replay';\n\n` +
    `export interface UaIcon { readonly name: string; readonly interaction: UaInteraction; readonly animationData: object; }\n`
);
for (const icon of catalog) {
  const data = readFileSync(join(iconSource, `${icon.name}.json`), 'utf8').trim();
  const symbol = exportName(icon.name);
  writeFileSync(
    join(iconDestination, `${icon.name}.ts`),
    `${header}import type { UaIcon } from './types';\n\n` +
      `export const ${symbol}: UaIcon = { name: '${icon.name}', interaction: '${icon.interaction}', animationData: ${data} };\n`
  );
}
// `bell` is the most natural discoverable alias for the notification icon.
writeFileSync(
  join(iconDestination, 'bell.ts'),
  `${header}import type { UaIcon } from './types';\nimport { notification } from './notification';\n\n` +
    `export const bell: UaIcon = { ...notification, name: 'bell' };\n`
);
writeFileSync(
  join(iconDestination, 'index.ts'),
  `${header}export type { UaIcon, UaInteraction } from './types';\nexport { bell } from './bell';\n${catalog
    .map((icon) => `export { ${exportName(icon.name)} } from './${icon.name}';`)
    .join('\n')}\n`
);
writeFileSync(
  join(iconDestination, 'ng-package.json'),
  `${JSON.stringify({ lib: { entryFile: 'index.ts' } }, null, 2)}\n`
);
cpSync(join(source, 'LICENSE'), 'THIRD_PARTY_NOTICES.md');
console.log(`Imported ${catalog.length} icons and ${readdirSync(playerSource).length} player files.`);
