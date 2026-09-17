import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.CODEGEN_GRAPHQL_URL ?? "http://localhost:4001/graphql",
  documents: [
    "**/*.ts",
    "**/*.tsx",
    "!.next/**",
    "!.next-employee-*/**",
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
