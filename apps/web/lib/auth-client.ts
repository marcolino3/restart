import { createAuthClient } from 'better-auth/react';

// No baseURL: the SDK uses the current origin (frontend), so requests hit
// /api/auth/* on the frontend which Next.js rewrites() forwards to the
// backend. This way Set-Cookie lands on the frontend domain and is
// readable from Next.js Server Actions / RSC via cookies().
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
