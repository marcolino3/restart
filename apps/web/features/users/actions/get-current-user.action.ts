"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

type UserEmail = {
  id: string;
  email: string;
  isPrimary: boolean;
  isVerified: boolean;
};

type AuthContextResponse = {
  authContext: {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      userEmails: UserEmail[];
    };
    roles: string[];
    permissions: string[];
    orgId?: string;
    orgName?: string;
    persona?:
      | "ADMIN"
      | "HR"
      | "OFFICE"
      | "TEACHER"
      | "PARENT"
      | "STUDENT"
      | "EMPLOYEE";
    isSuperAdmin: boolean;
    timeTrackingEnabled: boolean;
    isProjectMember: boolean;
  };
};

const GetAuthContextDocument = gql`
  query GetAuthContext {
    authContext {
      user {
        id
        firstName
        lastName
        userEmails {
          id
          email
          isPrimary
          isVerified
        }
      }
      roles
      permissions
      orgId
      orgName
      persona
      isSuperAdmin
      timeTrackingEnabled
      isProjectMember
    }
  }
`;

export const getCurrentUserAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const data: AuthContextResponse = await client.request(
      GetAuthContextDocument
    );

    const primaryEmail = data.authContext.user.userEmails.find(
      (e) => e.isPrimary
    );

    return {
      success: true,
      data: {
        ...data.authContext.user,
        email: primaryEmail?.email ?? data.authContext.user.userEmails[0]?.email,
        roles: data.authContext.roles,
        permissions: data.authContext.permissions,
        orgId: data.authContext.orgId,
        orgName: data.authContext.orgName,
        persona: data.authContext.persona,
        isSuperAdmin: data.authContext.isSuperAdmin,
        timeTrackingEnabled: data.authContext.timeTrackingEnabled,
        isProjectMember: data.authContext.isProjectMember,
      },
    };
  } catch (error) {
    console.log(error);
  }
};
