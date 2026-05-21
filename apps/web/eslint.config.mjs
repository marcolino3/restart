import { createRequire } from "module";

const require = createRequire(import.meta.url);
const coreWebVitals = require("eslint-config-next/core-web-vitals");
const typescript = require("eslint-config-next/typescript");

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      // React Compiler rules: downgrade to warn so legacy components don't
      // block CI. Fix incrementally when touching the affected files.
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
];

export default eslintConfig;
