"use server";

import { cookies } from "next/headers";

export type ImpersonationInfo = {
  isImpersonating: boolean;
  impersonatedBy?: string;
  /** Display name of the user currently impersonated (i.e. the *target*). */
  asUserName?: string;
};

/**
 * Returns whether the current browser session is an impersonation session.
 * Hits better-auth's `/api/auth/get-session`, which surfaces `impersonatedBy`
 * on the session object when an admin session is impersonating someone.
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
        session?: { impersonatedBy?: string | null };
        user?: { name?: string; firstName?: string; lastName?: string };
      } | null;
      const impersonatedBy = body?.session?.impersonatedBy ?? undefined;
      if (!impersonatedBy) return { isImpersonating: false };
      const asUserName =
        body?.user?.name ??
        ([body?.user?.firstName, body?.user?.lastName]
          .filter(Boolean)
          .join(" ") ||
          undefined);
      return { isImpersonating: true, impersonatedBy, asUserName };
    } catch {
      return { isImpersonating: false };
    }
  };
