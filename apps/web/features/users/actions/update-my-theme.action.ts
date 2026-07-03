"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const UpdateMyThemeDocument = gql`
  mutation UpdateMyTheme($input: UpdateMyThemeInput!) {
    updateMyTheme(input: $input)
  }
`;

/**
 * Persists the selected UI theme on the caller's own membership in the
 * active org (SuperAdmin without membership: on the user record).
 * Best-effort: the theme is already applied locally (localStorage +
 * data-theme), so a failure only means it won't follow the user to other
 * devices until the next successful save.
 */
export const updateMyThemeAction = async (theme: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(UpdateMyThemeDocument, { input: { theme } });
    return { success: true as const };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
