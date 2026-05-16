import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "http://localhost:4001/graphql",
  documents: ["**/*.ts", "**/*.tsx"],
  ignoreNoDocuments: true,
  generates: {
    "../../packages/shared-types/src/": {
      preset: "client",
      plugins: [],
    },
  },
};

export default config;
