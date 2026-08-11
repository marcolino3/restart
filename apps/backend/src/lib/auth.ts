import { betterAuth } from 'better-auth';
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from 'better-auth/api';
import {
  admin,
  customSession,
  magicLink,
  type SessionWithImpersonatedBy,
} from 'better-auth/plugins';
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

// Bridges the before-hook and after-hook of a single /admin/stop-impersonating
// request: by the time the after-hook runs, the handler has already deleted
// the impersonation session and the context reflects the restored admin
// session, so the ending session's id must be captured beforehand. Keyed by
// the request object's identity, which is stable across both hooks within
// one dispatch cycle; entries are removed by the after-hook and otherwise
// garbage-collected with the request if the handler throws.
const endingImpersonationSessions = new WeakMap<
  object,
  { sessionId: string; impersonatedBy: string }
>();

// better-auth doesn't publicly export a named type for the hook callback's
// `ctx` parameter (it's `better-call`'s internal `MiddlewareContext`, not a
// direct dependency of this package) — derive it structurally instead.
type AuthHookContext = Parameters<
  Parameters<typeof createAuthMiddleware>[0]
>[0];

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4001',
  secret: requireEnv('BETTER_AUTH_SECRET'),
  database: pool,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    // Wired for the employee onboarding invitation flow: EmployeeInvitationService
    // calls auth.api.requestPasswordReset(), better-auth stores a token in the
    // `verification` table and invokes this callback with the reset URL. The
    // frontend /onboarding/set-password page consumes the token via
    // authClient.resetPassword(). Doubles as the generic forgot-password mail.
    sendResetPassword: async ({ user, url }) => {
      try {
        await mailer.sendPasswordSetup(user.email, url);
      } catch (err) {
        // Never surface SMTP errors — would leak whether an email exists.
        console.error('[reset-password] sendMail failed:', err);
      }
    },
  },
  // OAuth state is stored in the `verification` DB table instead of an
  // encrypted cookie. Required for Expo: the in-app web browser (used
  // for OAuth) is a separate cookie jar from the Expo client, so the
  // default cookie-based state lookup fails on Mobile (state_mismatch
  // / "auth state cookie not found"). Database lookup works for both
  // Web (same cookie jar) and Mobile (no cookie needed).
  account: {
    storeStateStrategy: 'database',
    // Link a social sign-in to an existing user with the same email.
    // Google/Apple only issue tokens for emails they have themselves
    // verified (id_token email_verified=true), so trusting them bypasses
    // the local emailVerified check safely and avoids `account_not_linked`
    // when a user first signed up via email/password (credential) and later
    // signs in with Google. `credential` is safe to trust because creating
    // one requires the password anyway (no takeover vector).
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'apple', 'credential'],
    },
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
    //
    // Org-Admin "support impersonation" (start from the org-admin sidebar)
    // reuses this same endpoint but sends an extra `organizationId` in the
    // body. When present we additionally verify the target user is the
    // ORG_OWNER of that exact organization (before-hook) and shorten the
    // resulting session to 30 minutes + write an audit-log entry (after-hook).
    // Requests without `organizationId` (regular Teacher-Impersonation) keep
    // the plugin's default 1h duration and are not audit-logged here.

    before: createAuthMiddleware(async (ctx: AuthHookContext) => {
      if (
        ctx.path !== '/admin/impersonate-user' &&
        ctx.path !== '/admin/stop-impersonating'
      ) {
        return;
      }
      // Explicitly load the session — before-hooks don't auto-populate it.

      const session = await getSessionFromCtx<
        Record<string, unknown>,
        SessionWithImpersonatedBy
      >(ctx);
      const email = session?.user?.email;
      if (!email) {
        throw new APIError('UNAUTHORIZED', { message: 'No session' });
      }

      // Stop-Impersonating: Während der Impersonation IST die aktive Identität
      // der Mitarbeiter (nicht der SuperAdmin) — deshalb darf hier NICHT auf
      // is_super_admin geprüft werden. Erlaubt ist die Rückkehr, wenn die
      // Session eine aktive Impersonation ist (better-auth setzt
      // session.impersonatedBy auf den ursprünglichen SuperAdmin).
      if (ctx.path === '/admin/stop-impersonating') {
        const impersonatedBy = session.session.impersonatedBy;
        if (!impersonatedBy) {
          throw new APIError('FORBIDDEN', { message: 'Not impersonating' });
        }
        // The stop-impersonating handler deletes this session row and its
        // response only carries the restored admin session — capture the
        // ending session's id now so the after-hook can look up whether it
        // was an org-support session to audit-log.
        endingImpersonationSessions.set(ctx.request ?? ctx, {
          sessionId: session.session.id,
          impersonatedBy,
        });
        return;
      }

      // Impersonate-User (Start): nur SuperAdmins dürfen Impersonation starten.
      const queryResult = await pool.query<{ is_super_admin: boolean }>(
        `SELECT u.is_super_admin
             FROM users u
             INNER JOIN user_emails ue ON ue.user_id = u.id
             WHERE ue.email = $1
             LIMIT 1`,
        [email],
      );
      const result = queryResult.rows;
      const isSuperAdmin = result[0]?.is_super_admin === true;
      if (!isSuperAdmin) {
        throw new APIError('FORBIDDEN', { message: 'SuperAdmin only' });
      }

      // Org-Support-Impersonation: Ziel-User muss der ORG_OWNER exakt dieser
      // Organisation sein. `organizationId` kommt roh (unvalidiert) aus dem
      // Request-Body — wird hier NICHT als Autorisierung vertraut, sondern
      // nur als Filterkriterium für die DB-Prüfung genutzt.
      const body = ctx.body as
        { userId?: string; organizationId?: string } | undefined;
      const organizationId = body?.organizationId;
      if (organizationId) {
        const targetUserId = body?.userId;
        const ownerCheck = await pool.query<{ exists: boolean }>(
          `SELECT EXISTS (
               SELECT 1
               FROM users u
               INNER JOIN "user" bau ON bau.id = $1
               INNER JOIN user_emails ue ON ue.user_id = u.id AND ue.email = bau.email
               INNER JOIN memberships m ON m.user_id = u.id
               INNER JOIN membership_roles mr ON mr.membership_id = m.id
               INNER JOIN roles r ON r.id = mr.role_id
               WHERE m.organization_id = $2
                 AND r.system_code = 'ORG_OWNER'
             ) AS exists`,
          [targetUserId, organizationId],
        );
        if (ownerCheck.rows[0]?.exists !== true) {
          throw new APIError('FORBIDDEN', {
            message: 'Target user is not the owner of this organization',
          });
        }
      }
    }),

    after: createAuthMiddleware(async (ctx: AuthHookContext) => {
      if (
        ctx.path !== '/admin/impersonate-user' &&
        ctx.path !== '/admin/stop-impersonating'
      ) {
        return;
      }

      // Translates a better-auth user id (text) to the Restart `users.id`
      // (uuid) for the audit-log FK — same join as `authUserIdByUserId`
      // (users.resolver.ts) in reverse.
      const resolveDomainUserId = async (
        authUserId: string | undefined,
      ): Promise<string | null> => {
        if (!authUserId) return null;
        const row = await pool.query<{ user_id: string }>(
          `SELECT ue.user_id
               FROM "user" au
               INNER JOIN user_emails ue ON LOWER(ue.email) = LOWER(au.email)
               WHERE au.id = $1
               LIMIT 1`,
          [authUserId],
        );
        return row.rows[0]?.user_id ?? null;
      };

      if (ctx.path === '/admin/impersonate-user') {
        const body = ctx.body as
          { userId?: string; organizationId?: string } | undefined;
        const organizationId = body?.organizationId;
        if (!organizationId) return;

        const returned = ctx.context.returned as
          { session?: { id?: string; impersonatedBy?: string } } | undefined;
        const sessionId = returned?.session?.id;
        if (!sessionId) return;

        const actorUserId = await resolveDomainUserId(
          returned?.session?.impersonatedBy,
        );

        await pool.query(
          `UPDATE session SET "expiresAt" = now() + interval '30 minutes' WHERE id = $1`,
          [sessionId],
        );

        await pool.query(
          `INSERT INTO organization_audit_logs
               (id, "createdAt", "updatedAt", version, "isActive", "isArchived", organization_id, actor_user_id, action, payload)
             VALUES (uuid_generate_v4(), now(), now(), 1, true, false, $1, $2, 'IMPERSONATION_STARTED', $3)`,
          [
            organizationId,
            actorUserId,
            JSON.stringify({ targetUserId: body?.userId, sessionId }),
          ],
        );
        return;
      }

      // Stop-Impersonating: only log if the ended session was itself an
      // org-support session (i.e. its start produced an IMPERSONATION_STARTED
      // audit entry carrying its session id in the payload). The handler
      // already deleted the session row and the response/context now reflect
      // the restored admin session, so this must come from what the
      // before-hook captured.
      const requestKey = ctx.request ?? ctx;
      const ending = endingImpersonationSessions.get(requestKey);
      endingImpersonationSessions.delete(requestKey);
      if (!ending) return;

      const startEntry = await pool.query<{
        organization_id: string;
        payload: { targetUserId?: string };
      }>(
        `SELECT organization_id, payload
             FROM organization_audit_logs
             WHERE action = 'IMPERSONATION_STARTED'
               AND payload->>'sessionId' = $1
             ORDER BY "createdAt" DESC
             LIMIT 1`,
        [ending.sessionId],
      );
      const startRow = startEntry.rows[0];
      if (!startRow) return;

      const actorUserId = await resolveDomainUserId(ending.impersonatedBy);

      await pool.query(
        `INSERT INTO organization_audit_logs
             (id, "createdAt", "updatedAt", version, "isActive", "isArchived", organization_id, actor_user_id, action, payload)
           VALUES (uuid_generate_v4(), now(), now(), 1, true, false, $1, $2, 'IMPERSONATION_STOPPED', $3)`,
        [
          startRow.organization_id,
          actorUserId,
          JSON.stringify({
            targetUserId: startRow.payload?.targetUserId,
            sessionId: ending.sessionId,
          }),
        ],
      );
    }),
  },
});

export type Auth = typeof auth;
