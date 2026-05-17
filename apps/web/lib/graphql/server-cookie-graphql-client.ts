import { cookies } from "next/headers";
import { GraphQLClient, ClientError } from "graphql-request";
import { redirect } from "next/navigation";

/**
 * Reads the current request's cookies as a single header string.
 *
 * Call this **outside** of any `unstable_cache(...)` scope and pass the result
 * into `createGqlClientWithCookieHeader(...)` from within the cached function.
 * Next.js forbids `cookies()` inside `unstable_cache` (dynamic data sources are
 * disallowed in a cache scope).
 */
export const readSessionCookieHeader = async (): Promise<string> => {
  return (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
};

/**
 * Builds a GraphQL client around a pre-resolved cookie header.
 *
 * Use this from within `unstable_cache(...)` scopes (combine with
 * `readSessionCookieHeader()` which must be called *outside* the cache).
 */
export const createGqlClientWithCookieHeader = (cookieHeader: string) => {
  const url =
    process.env.INTERNAL_GRAPHQL_API_URL ||
    process.env.NEXT_PUBLIC_GRAPHQL_API_URL!;

  const baseClient = new GraphQLClient(url, {
    headers: { cookie: cookieHeader },
    fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
  });

  return new Proxy(baseClient, {
    get(target, prop) {
      if (prop === "request") {
        return async (...args: Parameters<typeof baseClient.request>) => {
          try {
            return await target.request(...args);
          } catch (error) {
            if (isAuthError(error)) {
              redirect("/sign-in");
            }
            throw error;
          }
        };
      }
      return Reflect.get(target, prop);
    },
  });
};

/**
 * Creates a GraphQL client with cookie-based authentication.
 * Automatically redirects to login on authentication errors.
 *
 * Convenience wrapper for non-cached call sites — combines
 * `readSessionCookieHeader()` + `createGqlClientWithCookieHeader()`.
 */
export const serverCookieGqlClient = async () => {
  const cookieHeader = await readSessionCookieHeader();
  return createGqlClientWithCookieHeader(cookieHeader);
};

function isAuthError(error: unknown): boolean {
  if (error instanceof ClientError) {
    return error.response?.errors?.some(
      (e) =>
        e.message?.toLowerCase().includes("unauthorized") ||
        e.extensions?.code === "UNAUTHENTICATED"
    ) ?? false;
  }
  return false;
}
