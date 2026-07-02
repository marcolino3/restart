import { NextRequest } from "next/server";
import { readSessionCookieHeader } from "@/lib/graphql/server-cookie-graphql-client";

/**
 * Proxy für den serverseitigen PDF-Report: leitet den Request mit den
 * Session-Cookies an das Backend weiter (Browser spricht nie direkt mit dem
 * Backend-REST-Endpoint; gleiche Origin-Strategie wie die GraphQL-Actions).
 */
export async function GET(req: NextRequest): Promise<Response> {
  const baseUrl = (
    process.env.INTERNAL_GRAPHQL_API_URL ||
    process.env.NEXT_PUBLIC_GRAPHQL_API_URL!
  ).replace(/\/graphql\/?$/, "");

  const search = req.nextUrl.searchParams.toString();
  const cookieHeader = await readSessionCookieHeader();

  const upstream = await fetch(
    `${baseUrl}/api/time-tracking/report?${search}`,
    {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    }
  );

  if (!upstream.ok) {
    return new Response(await upstream.text(), { status: upstream.status });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        upstream.headers.get("content-disposition") ?? "attachment",
    },
  });
}
