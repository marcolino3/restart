import { GraphQLClient } from "graphql-request";

export const createGraphQLClient = async (token: string) => {
  return new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_API_URL!, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
