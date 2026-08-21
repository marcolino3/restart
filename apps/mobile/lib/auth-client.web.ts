import { createAuthClient } from "better-auth/react";

import { API_BASE_URL } from "./env";

// Web counterpart of auth-client.ts. Metro resolves this file for the web
// bundle and the native one everywhere else, so the import path stays
// "@/lib/auth-client" on both platforms.
//
// The expoClient plugin is deliberately absent here: it persists the session
// in SecureStore and replays it as a header, which has no web equivalent and
// would mean holding a bearer token in JS-reachable storage. On web the
// session stays in better-auth's httpOnly cookie, which script can't read.
//
// `credentials: "include"` is what makes that cookie travel: the PWA is served
// from a different origin than the API (4002 vs 4001 in dev), so without it
// fetch would neither send the session cookie nor honour Set-Cookie. The
// backend already answers with `Access-Control-Allow-Credentials` via
// enableCors({ credentials: true }); the serving origin must additionally be
// listed in ALLOWED_ORIGINS, since CORS — unlike cookie scope — treats a
// different port as a different origin.
export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/api/auth`,
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

// Native's auth-client re-exports getCookie from the expo plugin for the
// GraphQL client to attach manually. On web the browser attaches the session
// cookie itself, so there is nothing to hand out — callers must not import it.
