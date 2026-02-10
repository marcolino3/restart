import { graphql } from "@/gql";
import { GetCurrentUserQuery } from "@/gql/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const GetCurrentUserDocument = graphql(`
  query GetCurrentUser {
    currentUser {
      id
      firstName
      lastName
      email
    }
  }
`);

export const getCurrentUserAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { currentUser }: GetCurrentUserQuery = await client.request(
      GetCurrentUserDocument
    );

    return { success: true, data: currentUser };
  } catch (error) {
    console.log(error);
  }
};
