"use server";

import { cookies } from "next/headers";

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

  let res: Response;
  try {
    res = await fetch(`${url}/api/auth/admin/impersonate-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      body: JSON.stringify({ userId }),
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

  const res = await fetch(`${url}/api/auth/admin/stop-impersonating`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: cookieHeader },
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
