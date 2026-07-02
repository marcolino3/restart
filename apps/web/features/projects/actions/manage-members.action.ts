"use server";

import { ROUTES } from "@/constants/routes";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { getLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import type { ProjectMemberRole } from "../types";

const AddDocument = gql`
  mutation AddProjectMember($input: AddProjectMemberInput!) {
    addProjectMember(input: $input) {
      id
    }
  }
`;

const UpdateRoleDocument = gql`
  mutation UpdateProjectMemberRole($input: UpdateProjectMemberRoleInput!) {
    updateProjectMemberRole(input: $input) {
      id
      role
    }
  }
`;

const RemoveDocument = gql`
  mutation RemoveProjectMember($id: ID!) {
    removeProjectMember(id: $id)
  }
`;

const revalidate = (locale: string, projectId: string) =>
  revalidatePath(ROUTES.admin.projectsBoard(locale, projectId));

export const addProjectMemberAction = async (input: {
  projectId: string;
  membershipId: string;
  role: ProjectMemberRole;
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { addProjectMember } = await client.request<{
      addProjectMember: { id: string };
    }>(AddDocument, { input });
    revalidate(locale, input.projectId);
    return { success: true as const, data: addProjectMember };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

export const updateProjectMemberRoleAction = async (input: {
  id: string;
  role: ProjectMemberRole;
  projectId: string;
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { updateProjectMemberRole } = await client.request<{
      updateProjectMemberRole: { id: string; role: ProjectMemberRole };
    }>(UpdateRoleDocument, { input: { id: input.id, role: input.role } });
    revalidate(locale, input.projectId);
    return { success: true as const, data: updateProjectMemberRole };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};

export const removeProjectMemberAction = async (input: {
  id: string;
  projectId: string;
}) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { removeProjectMember } = await client.request<{
      removeProjectMember: boolean;
    }>(RemoveDocument, { id: input.id });
    revalidate(locale, input.projectId);
    return { success: true as const, data: removeProjectMember };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
