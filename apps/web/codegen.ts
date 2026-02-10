import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "http://localhost:4001/graphql",
  documents: "**/*.ts", // oder z.B. "app/**/*.tsx" wenn du appDir verwendest
  generates: {
    "gql/": {
      preset: "client",
      plugins: [],
    },
  },
};

export default config;
