import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "http://localhost:4001/graphql",
  documents: [
    "**/*.ts",
    "**/*.tsx",
    "!.next/**",
    "!node_modules/**",
    "!**/*.d.ts",
  ],
  ignoreNoDocuments: true,
  generates: {
    "../../packages/shared-types/src/": {
      preset: "client",
      plugins: [],
    },
  },
};

export default config;
