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
 * Authenticates a graphql-ws connection from the raw upgrade request. The
 * session cookie rides on the upgrade HTTP request's headers (same-origin
 * browsers always send it), so we can reuse the exact better-auth session
 * resolution the HTTP guard uses — cookieParser/helmet do NOT run on the WS
 * upgrade path, but better-auth reads the raw Cookie header itself.
 *
 * Returns null when there is no valid session (caller should reject the
 * connection). A valid session with a stale/absent org resolves to a result
 * with membershipId/orgId undefined — subscriptions are all org-scoped and
 * their participant filter will then simply deliver nothing.
 */
export async function authenticateWsConnection(
  em: EntityManager,
  request: IncomingMessage,
  allowedOrigins: string[],
): Promise<WsAuthResult | null> {
  // Defense-in-depth against cross-site WebSocket hijacking: the session cookie
  // is sameSite, but we additionally reject upgrades from disallowed origins.
  const origin = request.headers.origin;
  if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return null;
  }

  const session = await auth.api.getSession({
    headers: request.headers as unknown as Headers,
  });
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
