import { cookies } from "next/headers";
import { GraphQLClient } from "graphql-request";

export const serverCookieGqlClient = async () => {
  const cookieHeader = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const url =
    process.env.INTERNAL_GRAPHQL_API_URL ||
    process.env.NEXT_PUBLIC_GRAPHQL_API_URL!;
  return new GraphQLClient(url, {
    headers: { cookie: cookieHeader },
    fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
  });
};
