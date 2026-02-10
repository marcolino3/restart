import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

type AuthContextResponse = {
  authContext: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    roles: string[];
    permissions: string[];
    orgId?: string;
    isSuperAdmin: boolean;
  };
};

const GetAuthContextDocument = gql`
  query GetAuthContext {
    authContext {
      user {
        id
        firstName
        lastName
        email
      }
      roles
      permissions
      orgId
      isSuperAdmin
    }
  }
`;

export const getCurrentUserAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const data: AuthContextResponse = await client.request(
      GetAuthContextDocument
    );

    return {
      success: true,
      data: {
        ...data.authContext.user,
        roles: data.authContext.roles,
        permissions: data.authContext.permissions,
        orgId: data.authContext.orgId,
        isSuperAdmin: data.authContext.isSuperAdmin,
      },
    };
  } catch (error) {
    console.log(error);
  }
};
