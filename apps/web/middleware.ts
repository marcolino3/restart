import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/rounting";

const intlMiddleware = createMiddleware(routing);

// Pfade (ohne Locale-Präfix), die eine angemeldete Session erfordern.
const PROTECTED_PREFIXES = ["/admin", "/select-org"];

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token", // dev / non-secure
  "__Secure-better-auth.session_token", // production (secure cookies)
];

function hasSessionCookie(req: NextRequest): boolean {
  return req.cookies
    .getAll()
    .some((c) => SESSION_COOKIE_NAMES.includes(c.name) && Boolean(c.value));
}

export default function middleware(req: NextRequest) {
  const segments = req.nextUrl.pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];
  const hasLocale = (routing.locales as readonly string[]).includes(
    maybeLocale,
  );
  const locale = hasLocale ? maybeLocale : routing.defaultLocale;
  const rest = "/" + segments.slice(hasLocale ? 1 : 0).join("/");

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => rest === p || rest.startsWith(`${p}/`),
  );

  // Nicht eingeloggt + geschützte Route → zur Login-Seite.
  if (isProtected && !hasSessionCookie(req)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/sign-in`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
