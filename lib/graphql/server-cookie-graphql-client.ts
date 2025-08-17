import { cookies } from "next/headers";
import { GraphQLClient } from "graphql-request";

export const serverCookieGqlClient = async () => {
  const cookieHeader = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_API_URL!, {
    headers: { cookie: cookieHeader },
    fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
  });
};
