import { betterAuth } from 'better-auth';
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from 'better-auth/api';
import { admin, customSession, magicLink } from 'better-auth/plugins';
import { mailer } from './mailer';
import { expo } from '@better-auth/expo';
import * as jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    // Tests don't exercise the real auth flow (better-auth is mocked via
    // jest moduleNameMapper). Fall back to a dummy so module-load doesn't
    // fail when DB_* env vars aren't injected by the test runner.
    if (process.env.NODE_ENV === 'test') return '';
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

// Apple requires an ES256-signed JWT as clientSecret. Build it at module load
// if the secrets are present; skip the provider entirely otherwise so dev/CI
// without Apple Developer credentials still boots.
const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID ?? 'ch.restart.app';

const buildAppleSocialConfig = () => {
  const privateKey = process.env.APPLE_AUTH_PRIVATE_KEY;
  const clientId = process.env.APPLE_AUTH_CLIENT_ID;
  const teamId = process.env.APPLE_AUTH_TEAM_ID;
  const keyId = process.env.APPLE_AUTH_KEY_ID;
  if (!privateKey || !clientId || !teamId || !keyId) return undefined;

  const normalizedKey = privateKey.replace(/\\n/g, '\n');
  const clientSecret = jwt.sign({}, normalizedKey, {
    algorithm: 'ES256',
    issuer: teamId,
    audience: 'https://appleid.apple.com',
    subject: clientId,
    expiresIn: '180d',
    keyid: keyId,
  });

  return {
    clientId,
    clientSecret,
    appBundleIdentifier: APPLE_BUNDLE_ID,
  };
};

const appleSocial = buildAppleSocialConfig();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4001',
  secret: requireEnv('BETTER_AUTH_SECRET'),
  database: pool,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  // OAuth state is stored in the `verification` DB table instead of an
  // encrypted cookie. Required for Expo: the in-app web browser (used
  // for OAuth) is a separate cookie jar from the Expo client, so the
  // default cookie-based state lookup fails on Mobile (state_mismatch
  // / "auth state cookie not found"). Database lookup works for both
  // Web (same cookie jar) and Mobile (no cookie needed).
  account: {
    storeStateStrategy: 'database',
  },
  socialProviders: {
    google: {
      clientId: requireEnv('GOOGLE_AUTH_CLIENT_ID'),
      clientSecret: requireEnv('GOOGLE_AUTH_CLIENT_SECRET'),
      // Immer die Google-Kontoauswahl erzwingen. Ohne dies meldet Google nach
      // einem Logout stillschweigend dasselbe Konto wieder an (kein Chooser),
      // sodass man sich nicht mit einem anderen Account einloggen kann.
      prompt: 'select_account',
      // No redirectURI override: callback lands on backend
      // (${baseURL}/api/auth/callback/google = localhost:4001 in dev),
      // which keeps the state cookie on the same origin as where it was
      // set during the expo()-proxy leg of the mobile flow.
      // The web flow still works because localhost shares cookies across
      // ports; for production the cookie config must allow the parent
      // domain (e.g. set cookie Domain= to a shared parent) so the web
      // frontend and backend subdomains both see the auth cookie.
    },
    ...(appleSocial ? { apple: appleSocial } : {}),
  },
  plugins: [
    // Surfaces the active organization id (from the Active-Org cookie) on
    // session.activeOrganizationId so every consumer reads it uniformly.
    // Membership validation happens in GqlBetterAuthGuard / OrgSwitchController
    // — this callback is intentionally cheap (no DB hit).
    // eslint-disable-next-line @typescript-eslint/require-await -- customSession's signature requires a Promise return
    customSession(async ({ user, session }, ctx) => {
      const cookieHeader =
        ctx.headers?.get?.('cookie') ?? ctx.request?.headers.get('cookie');
      const raw =
        parseCookie(cookieHeader, ACTIVE_ORG_COOKIE) ??
        ctx.headers?.get?.(ACTIVE_ORG_COOKIE.toLowerCase()) ??
        ctx.request?.headers.get(ACTIVE_ORG_COOKIE.toLowerCase()) ??
        undefined;
      const activeOrganizationId = raw && UUID_RE.test(raw) ? raw : null;
      return { user, session, activeOrganizationId };
    }),
    // Admin plugin enables impersonation (`/api/auth/admin/impersonate-user`)
    // and stop-impersonating (`/api/auth/admin/stop-impersonating`). The
    // plugin's built-in role check is bypassed via the before-hook below —
    // we authorize against our own `isSuperAdmin` flag, not better-auth's
    // optional `role` column.
    admin({
      impersonationSessionDuration: 60 * 60, // 1 hour
    }),
    // Magic-Link plugin: client ruft authClient.signIn.magicLink({ email }),
    // better-auth speichert Token im `verification`-Table (15min Default),
    // sendMagicLink-Callback verschickt die Mail mit dem callback-URL.
    // Verify-Endpoint ist /api/auth/magic-link/verify?token=... — better-auth
    // setzt automatisch die Session-Cookie und redirected zu callbackURL.
    magicLink({
      expiresIn: 60 * 15, // 15 minutes
      sendMagicLink: async ({ email, url }) => {
        try {
          await mailer.sendMagicLink(email, url);
        } catch (err) {
          // Don't surface SMTP errors to the client — would leak
          // whether an email exists. Log instead.
          console.error('[magic-link] sendMail failed:', err);
        }
      },
    }),
    expo(),
  ],
  hooks: {
    // Gate `/admin/impersonate-user` and `/admin/stop-impersonating` to
    // SuperAdmins only. better-auth has its own `user` table (separate from
    // the Restart `users` table where `is_super_admin` lives), so the
    // session.user shape doesn't carry that flag — we look it up directly
    // in our domain DB by email.

    before: createAuthMiddleware(async (ctx: any) => {
      if (
        ctx.path !== '/admin/impersonate-user' &&
        ctx.path !== '/admin/stop-impersonating'
      ) {
        return;
      }
      // Explicitly load the session — before-hooks don't auto-populate it.

      const session = (await getSessionFromCtx(ctx)) as any;
      const email = session?.user?.email as string | undefined;
      if (!email) {
        throw new APIError('UNAUTHORIZED', { message: 'No session' });
      }
      const result: Array<{ is_super_admin: boolean }> = await pool
        .query(
          `SELECT u.is_super_admin
             FROM users u
             INNER JOIN user_emails ue ON ue.user_id = u.id
             WHERE ue.email = $1
             LIMIT 1`,
          [email],
        )
        .then((r) => r.rows);
      const isSuperAdmin = result[0]?.is_super_admin === true;
      if (!isSuperAdmin) {
        throw new APIError('FORBIDDEN', { message: 'SuperAdmin only' });
      }
    }),
  },
});

export type Auth = typeof auth;
