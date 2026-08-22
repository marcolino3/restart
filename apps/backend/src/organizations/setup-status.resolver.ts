import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { SetupStatus } from './dto/setup-status.output';
import { SetupStatusService } from './setup-status.service';
import { SystemRole } from '@/roles/entities/system-role.enum';

@Resolver(() => SetupStatus)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class SetupStatusResolver {
  constructor(private readonly service: SetupStatusService) {}

  /**
   * Read-only progress of the initial setup, scoped to the session's org.
   *
   * Restricted to the admin-capable roles: the setup wizard is organisation
   * administration, and every step it links to is an admin-only page. Members
   * without one of these roles cannot act on any step, so the counts are of no
   * use to them and stay hidden.
   */
  @Roles(
    SystemRole.ORG_OWNER,
    SystemRole.ORG_ADMIN,
    SystemRole.HR_MANAGER,
    SystemRole.OFFICE,
  )
  @Query(() => SetupStatus, { name: 'organizationSetupStatus' })
  getSetupStatus(@CurrentOrgId() orgId: string) {
    return this.service.getStatus(orgId);
  }
}
