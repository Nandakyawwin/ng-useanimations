/** Removes only superseded generated icon directories from earlier package-layout experiments. */
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const root = resolve('.');
const staleDirectories = ['src/icons', 'src/lib/icons'];
const expectedHeader = '// Derived from useAnimations (MIT), Copyright (c) 2018-2026 useAnimations.';

for (const directory of staleDirectories) {
  const target = resolve(root, directory);
  if (relative(root, target).startsWith('..')) throw new Error(`Refusing to clean outside the repository: ${target}`);
  if (!existsSync(target)) continue;

  const files = readdirSync(target, { recursive: true }).filter((entry) => entry.endsWith('.ts'));
  if (!files.length || files.some((file) => !readFileSync(resolve(target, file), 'utf8').startsWith(expectedHeader))) {
    throw new Error(`Refusing to remove ${directory}: it is not exclusively generated upstream icon code.`);
  }
  rmSync(target, { recursive: true, force: false });
  console.log(`Removed stale generated directory: ${directory} (${files.length} files)`);
}
