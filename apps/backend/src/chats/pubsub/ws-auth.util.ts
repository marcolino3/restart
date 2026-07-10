import { EntityManager } from 'typeorm';
import type { IncomingMessage } from 'http';
import { auth } from '@/lib/auth';
import { getAuthContext } from '@/auth/utils/get-auth-context.util';
import { Organization } from '@/organizations/entities/organization.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';

export interface WsAuthResult {
  userId: string;
  orgId?: string;
  membershipId?: string;
}

/**
 * Authenticates a graphql-ws connection. Two transports carry the session:
 *
 * - Same-origin browsers (web) send the httpOnly cookie automatically on the
 *   WS upgrade request, so it arrives in `request.headers.cookie`.
 * - React Native has no cookie store and does not send cookies on WS upgrades,
 *   so the mobile client passes the serialized cookie via graphql-ws
 *   `connectionParams` instead; that value arrives here as `cookieOverride`.
 *
 * Either way we resolve the session with the exact better-auth logic the HTTP
 * guard uses. Returns null when there is no valid session (caller rejects the
 * connection). A valid session with a stale/absent org resolves to a result
 * with membershipId/orgId undefined — subscriptions are all org-scoped and
 * their participant filter then simply delivers nothing.
 */
export async function authenticateWsConnection(
  em: EntityManager,
  request: IncomingMessage,
  allowedOrigins: string[],
  cookieOverride?: string | null,
): Promise<WsAuthResult | null> {
  // Defense-in-depth against cross-site WebSocket hijacking: the session cookie
  // is sameSite, but we additionally reject upgrades from a disallowed origin.
  // A missing origin (native clients) is allowed through — they authenticate
  // via connectionParams, which a cross-site browser page cannot forge.
  const origin = request.headers.origin;
  if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return null;
  }

  // Build the headers better-auth reads the session from. Prefer the
  // connectionParams cookie (mobile) over the upgrade request's own header.
  const headers = new Headers();
  const cookie = cookieOverride ?? request.headers.cookie;
  if (cookie) headers.set('cookie', cookie);

  const session = await auth.api.getSession({ headers });
  if (!session?.user?.email) return null;

  // Resolve the domain user via the user_emails join, mirroring
  // UsersService.findOneByEmail (there is no direct email column on User).
  const userEmail = await em
    .findOne(UserEmail, { where: { email: session.user.email } })
    .catch(() => null);
  if (!userEmail?.userId) return null;
  const userId = userEmail.userId;

  const orgId = session.activeOrganizationId ?? undefined;
  let membershipId: string | undefined;
  if (orgId) {
    const orgExists = await em.existsBy(Organization, { id: orgId });
    if (orgExists) {
      const ctx = await getAuthContext(em, userId, orgId).catch(() => null);
      membershipId = ctx?.membership?.id;
    }
  }

  return { userId, orgId, membershipId };
}
