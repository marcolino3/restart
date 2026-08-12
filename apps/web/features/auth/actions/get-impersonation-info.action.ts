"use server";

import { cookies } from "next/headers";
import { graphql } from "@restart/shared-types";
import { OrganizationNameQuery } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

export type ImpersonationInfo = {
  isImpersonating: boolean;
  impersonatedBy?: string;
  /** Display name of the user currently impersonated (i.e. the *target*). */
  asUserName?: string;
  /** Session expiry (ISO string) — org-support sessions are capped at 30min. */
  expiresAt?: string;
  organizationId?: string;
  organizationName?: string;
};

const OrganizationNameDocument = graphql(`
  query OrganizationName($id: String!) {
    organization(id: $id) {
      id
      name
    }
  }
`);

/**
 * Returns whether the current browser session is an impersonation session.
 * Hits better-auth's `/api/auth/get-session`, which surfaces `impersonatedBy`
 * on the session object when an admin session is impersonating someone.
 * For org-support sessions (`activeOrganizationId` present, set via the
 * `customSession` plugin from the Active-Org cookie), also resolves the
 * organization's display name so the banner can show org context.
 */
export const getImpersonationInfoAction =
  async (): Promise<ImpersonationInfo> => {
    const url =
      process.env.INTERNAL_GRAPHQL_API_URL?.replace(/\/graphql\/?$/, "") ||
      process.env.NEXT_PUBLIC_GRAPHQL_API_URL!.replace(/\/graphql\/?$/, "");

    const cookieHeader = (await cookies())
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    try {
      const res = await fetch(`${url}/api/auth/get-session`, {
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });
      if (!res.ok) return { isImpersonating: false };
      const body = (await res.json()) as {
        session?: {
          impersonatedBy?: string | null;
          expiresAt?: string | null;
        };
        user?: { name?: string; firstName?: string; lastName?: string };
        activeOrganizationId?: string | null;
      } | null;
      const impersonatedBy = body?.session?.impersonatedBy ?? undefined;
      if (!impersonatedBy) return { isImpersonating: false };
      const asUserName =
        body?.user?.name ??
        ([body?.user?.firstName, body?.user?.lastName]
          .filter(Boolean)
          .join(" ") ||
          undefined);
      const expiresAt = body?.session?.expiresAt ?? undefined;
      const organizationId = body?.activeOrganizationId ?? undefined;

      let organizationName: string | undefined;
      if (organizationId) {
        try {
          const client = await serverCookieGqlClient();
          const { organization } = await client.request<OrganizationNameQuery>(
            OrganizationNameDocument,
            { id: organizationId }
          );
          organizationName = organization?.name ?? undefined;
        } catch {
          organizationName = undefined;
        }
      }

      return {
        isImpersonating: true,
        impersonatedBy,
        asUserName,
        expiresAt,
        organizationId,
        organizationName,
      };
    } catch {
      return { isImpersonating: false };
    }
  };
