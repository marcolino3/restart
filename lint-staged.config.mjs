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
  'apps/backend/**/*.{ts,js}': (files) => {
    // `scripts/` is excluded from apps/backend/tsconfig.json, so type-aware
    // ESLint cannot load those files via the project service.
    const eslintFiles = files.filter((f) => !f.includes('/scripts/'));
    return [...prettierCheck(files), ...eslintFix('apps/backend', eslintFiles)];
  },
  'apps/web/**/*.{ts,tsx,js,jsx,mjs}': (files) =>
    eslintFix('apps/web', files),
  'apps/mobile/**/*.{ts,tsx,js,jsx}': (files) =>
    eslintFix('apps/mobile', files),
};
