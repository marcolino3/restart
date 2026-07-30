// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // APIError aus better-auth ist eine echte Error-Subklasse, aber die
      // d.ts-Typings (InstanceType-Pattern) verstecken die Vererbung vor
      // typescript-eslint. Whitelisten ist hier sauber, weil throw new APIError
      // die offizielle better-auth-API ist.
      '@typescript-eslint/only-throw-error': ['error', { allow: ['APIError'] }],
    },
  },
  {
    // Test files legitimately use `any` for repository/service mocks, jest.fn
    // casts and partial fixtures — typing every mock adds noise without value.
    // The no-unsafe-* family is therefore relaxed in test contexts only;
    // production code under src/ keeps them as warnings.
    files: [
      '**/*.spec.ts',
      '**/*.e2e-spec.ts',
      '**/*.integration.spec.ts',
      'test/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
);