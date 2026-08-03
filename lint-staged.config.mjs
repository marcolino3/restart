/** @typedef {import('lint-staged').Config} Config */

/** @param {string[]} files */
function quote(files) {
  return files.map((file) => `"${file}"`).join(' ');
}

/**
 * Run eslint --fix from a workspace package directory so flat-config
 * tsconfigRootDir resolves correctly.
 *
 * @param {string} workspaceDir
 * @param {string[]} files
 */
function eslintFix(workspaceDir, files) {
  if (files.length === 0) return [];
  return [
    `pnpm --dir ${workspaceDir} exec eslint --fix ${quote(files)}`,
  ];
}

/** @param {string[]} files */
function prettierCheck(files) {
  if (files.length === 0) return [];
  return [
    `pnpm --dir apps/backend exec prettier --check ${quote(files)}`,
  ];
}

/** @type {Config} */
export default {
  'apps/backend/**/*.{ts,js}': (files) => [
    ...prettierCheck(files),
    ...eslintFix('apps/backend', files),
  ],
  'apps/web/**/*.{ts,tsx,js,jsx,mjs}': (files) =>
    eslintFix('apps/web', files),
  'apps/mobile/**/*.{ts,tsx,js,jsx}': (files) =>
    eslintFix('apps/mobile', files),
};
