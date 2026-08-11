// Enforces org-level feature toggles on gated resolvers/mutations.
// Complements GraphQLAccessGuard (role/permission-side): a request for a
// disabled feature throws ForbiddenException even if the user otherwise has
// permission, so a SuperAdmin-disabled module is actually unreachable.
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectEntityManager } from '@nestjs/typeorm';
import type { Request } from 'express';
import { EntityManager } from 'typeorm';

import {
  FEATURE_CATALOG,
  type OrgFeatureKey,
} from '@restart/shared-schemas/org-features/feature-catalog';
import { ORG_FEATURE_REQUIRED_KEY } from '@/auth/decorators/org-feature-required.decorator';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import {
  getOrgFeatureCacheEntry,
  isOrgFeatureEnabled,
} from '@/organizations/utils/org-feature-cache';

@Injectable()
export class OrgFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectEntityManager() private readonly em: EntityManager,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureKey = this.reflector.getAllAndOverride<
      OrgFeatureKey | undefined
    >(ORG_FEATURE_REQUIRED_KEY, [context.getHandler(), context.getClass()]);
    if (!featureKey) return true;

    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext<{ req: Request & { user?: TokenPayload } }>()
      .req;
    const user = req?.user;

    if (user?.isSuperAdmin) return true;
    if (!user?.orgId) return false;

    const cacheEntry = await getOrgFeatureCacheEntry(this.em, user.orgId);

    // Walk the dependsOn chain: setEnabled() persists the cascade, but the
    // guard re-checks ancestors too as defense in depth against any state
    // where a child row is enabled while its parent isn't (e.g. stale cache).
    let key: OrgFeatureKey | undefined = featureKey;
    while (key) {
      if (!isOrgFeatureEnabled(cacheEntry, key)) {
        throw new ForbiddenException(
          `Feature "${featureKey}" is disabled for this organization`,
        );
      }
      key = FEATURE_CATALOG[key].dependsOn;
    }

    return true;
  }
}
