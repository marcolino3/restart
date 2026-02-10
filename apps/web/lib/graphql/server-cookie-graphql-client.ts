import { cookies } from "next/headers";
import { GraphQLClient, ClientError } from "graphql-request";
import { redirect } from "next/navigation";

/**
 * Creates a GraphQL client with cookie-based authentication.
 * Automatically redirects to login on authentication errors.
 */
export const serverCookieGqlClient = async () => {
  const cookieHeader = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

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
