import { betterAuth } from 'better-auth';
import { customSession } from 'better-auth/plugins';
import { Pool } from 'pg';

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const pool = new Pool({
  host: requireEnv('DB_HOST'),
  port: Number(requireEnv('DB_PORT')),
  user: requireEnv('DB_USERNAME'),
  password: requireEnv('DB_PASSWORD'),
  database: requireEnv('DB_NAME'),
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

const trustedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:4000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const ACTIVE_ORG_COOKIE = 'Active-Org';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Parse a single cookie value out of a Cookie header string. We don't pull in
// a parser dep — Active-Org is the only field we read here and it's a UUID.
const parseCookie = (header: string | null | undefined, name: string) => {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
};

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4001',
  secret: requireEnv('BETTER_AUTH_SECRET'),
  database: pool,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: requireEnv('GOOGLE_AUTH_CLIENT_ID'),
      clientSecret: requireEnv('GOOGLE_AUTH_CLIENT_SECRET'),
      // Force the OAuth callback through the frontend's Next.js proxy
      // (frontend rewrites /api/* to backend). This makes the
      // better-auth session cookie land on the frontend domain — required
      // for Next.js Server Actions to read it via cookies().
      redirectURI:
        process.env.BETTER_AUTH_GOOGLE_REDIRECT_URI ??
        'http://localhost:4000/api/auth/callback/google',
    },
  },
  plugins: [
    // Surfaces the active organization id (from the Active-Org cookie) on
    // session.activeOrganizationId so every consumer reads it uniformly.
    // Membership validation happens in GqlBetterAuthGuard / OrgSwitchController
    // — this callback is intentionally cheap (no DB hit).
    customSession(async ({ user, session }, ctx) => {
      const cookieHeader =
        ctx.headers?.get?.('cookie') ?? ctx.request?.headers.get('cookie');
      const raw = parseCookie(cookieHeader, ACTIVE_ORG_COOKIE);
      const activeOrganizationId = raw && UUID_RE.test(raw) ? raw : null;
      return { user, session, activeOrganizationId };
    }),
  ],
});

export type Auth = typeof auth;
