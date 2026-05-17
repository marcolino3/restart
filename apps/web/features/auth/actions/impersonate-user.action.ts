"use server";

import { cookies, headers } from "next/headers";
import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

/**
 * Restart `users.id` (UUID) → better-auth `user.id` (text).
 * The impersonate endpoint looks up users in better-auth's own user table
 * which has separate ids from our domain `users` table. Translation runs
 * via shared email; the backend query is SuperAdmin-only.
 */
const TranslateUserIdDocument = gql`
  query AuthUserIdByUserId($userId: ID!) {
    authUserIdByUserId(userId: $userId)
  }
`;

const resolveAuthUserId = async (
  restartUserId: string,
): Promise<string | null> => {
  try {
    const client = await serverCookieGqlClient();
    const { authUserIdByUserId } = await client.request<{
      authUserIdByUserId: string | null;
    }>(TranslateUserIdDocument, { userId: restartUserId });
    return authUserIdByUserId ?? null;
  } catch (error) {
    console.error("authUserIdByUserId lookup failed", error);
    return null;
  }
};

/**
 * Resolves an Origin header value that better-auth will accept (trusted
 * origin). Prefers the current request's Origin (server-action runs inside
 * the user's request lifecycle); falls back to `NEXT_PUBLIC_BASE_URL`
 * or `http://localhost:4000` for dev.
 */
const resolveOrigin = async (): Promise<string> => {
  const h = await headers();
  return (
    h.get("origin") ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:4000"
  );
};

/**
 * SuperAdmin-only: starts an impersonation session for the given target user.
 * Calls better-auth's `/api/auth/admin/impersonate-user` endpoint with the
 * caller's current session cookie. On success, better-auth issues a new
 * session cookie that we propagate back to the browser via next/headers.
 *
 * The browser's session cookie will now point to the impersonated user;
 * the original admin session is preserved server-side and can be restored
 * via the corresponding `stop-impersonating` endpoint.
 */
export const impersonateUserAction = async (
  userId: string,
): Promise<
  { success: true } | { success: false; error: string; status?: number }
> => {
  const url =
    process.env.INTERNAL_GRAPHQL_API_URL?.replace(/\/graphql\/?$/, "") ||
    process.env.NEXT_PUBLIC_GRAPHQL_API_URL!.replace(/\/graphql\/?$/, "");

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const origin = await resolveOrigin();

  // Translate Restart user id (UUID) → better-auth user id (text).
  const authUserId = await resolveAuthUserId(userId);
  if (!authUserId) {
    return {
      success: false,
      error: "Target user has no linked auth account",
    };
  }

  let res: Response;
  try {
    res = await fetch(`${url}/api/auth/admin/impersonate-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // better-auth's CSRF check requires a matching `Origin` from
        // `trustedOrigins`. Server-action fetch wouldn't send one by default.
        origin,
        cookie: cookieHeader,
      },
      body: JSON.stringify({ userId: authUserId }),
      cache: "no-store",
      redirect: "manual",
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      success: false,
      status: res.status,
      error: body || `Impersonation failed (${res.status})`,
    };
  }

  // Forward every Set-Cookie header from better-auth into the browser response.
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const raw of setCookies) {
    const [pair, ...attrs] = raw.split(";").map((s) => s.trim());
    const eqIdx = pair.indexOf("=");
    if (eqIdx < 0) continue;
    const name = pair.slice(0, eqIdx);
    const value = pair.slice(eqIdx + 1);

    const opts: Record<string, unknown> = {};
    for (const a of attrs) {
      const [k, v] = a.split("=");
      const key = k.toLowerCase().trim();
      if (key === "path") opts.path = v;
      else if (key === "max-age") opts.maxAge = Number(v);
      else if (key === "expires") opts.expires = new Date(v);
      else if (key === "samesite") {
        const norm = v?.toLowerCase();
        if (norm === "lax" || norm === "strict" || norm === "none")
          opts.sameSite = norm;
      } else if (key === "secure") opts.secure = true;
      else if (key === "httponly") opts.httpOnly = true;
      else if (key === "domain") opts.domain = v;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cookieStore.set({ name, value, ...opts } as any);
  }

  return { success: true };
};

export const stopImpersonatingAction = async (): Promise<
  { success: true } | { success: false; error: string }
> => {
  const url =
    process.env.INTERNAL_GRAPHQL_API_URL?.replace(/\/graphql\/?$/, "") ||
    process.env.NEXT_PUBLIC_GRAPHQL_API_URL!.replace(/\/graphql\/?$/, "");

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const origin = await resolveOrigin();
  const res = await fetch(`${url}/api/auth/admin/stop-impersonating`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin,
      cookie: cookieHeader,
    },
    cache: "no-store",
    redirect: "manual",
  });

  if (!res.ok) {
    return {
      success: false,
      error: (await res.text().catch(() => "")) || `Failed (${res.status})`,
    };
  }

  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const raw of setCookies) {
    const [pair, ...attrs] = raw.split(";").map((s) => s.trim());
    const eqIdx = pair.indexOf("=");
    if (eqIdx < 0) continue;
    const name = pair.slice(0, eqIdx);
    const value = pair.slice(eqIdx + 1);
    const opts: Record<string, unknown> = {};
    for (const a of attrs) {
      const [k, v] = a.split("=");
      const key = k.toLowerCase().trim();
      if (key === "path") opts.path = v;
      else if (key === "max-age") opts.maxAge = Number(v);
      else if (key === "samesite") {
        const norm = v?.toLowerCase();
        if (norm === "lax" || norm === "strict" || norm === "none")
          opts.sameSite = norm;
      } else if (key === "secure") opts.secure = true;
      else if (key === "httponly") opts.httpOnly = true;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cookieStore.set({ name, value, ...opts } as any);
  }

  return { success: true };
};
