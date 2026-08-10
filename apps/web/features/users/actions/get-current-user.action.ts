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
    fieldPermissions: { resource: string; field: string; actions: string[] }[];
    orgId?: string;
    orgName?: string;
    orgTimezone?: string;
    persona?:
      | "ADMIN"
      | "HR"
      | "OFFICE"
      | "TEACHER"
      | "PARENT"
      | "STUDENT"
      | "EMPLOYEE";
    theme?: string | null;
    isSuperAdmin: boolean;
    timeTrackingEnabled: boolean;
    isProjectMember: boolean;
    enabledFeatures: string[];
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
      fieldPermissions {
        resource
        field
        actions
      }
      orgId
      orgName
      orgTimezone
      persona
      theme
      isSuperAdmin
      timeTrackingEnabled
      isProjectMember
      enabledFeatures
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
        fieldPermissions: data.authContext.fieldPermissions,
        orgId: data.authContext.orgId,
        orgName: data.authContext.orgName,
        orgTimezone: data.authContext.orgTimezone,
        persona: data.authContext.persona,
        theme: data.authContext.theme,
        isSuperAdmin: data.authContext.isSuperAdmin,
        timeTrackingEnabled: data.authContext.timeTrackingEnabled,
        isProjectMember: data.authContext.isProjectMember,
        enabledFeatures: data.authContext.enabledFeatures,
      },
    };
  } catch (error) {
    console.log(error);
  }
};
