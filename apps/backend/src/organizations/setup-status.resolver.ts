import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { SetupStatus } from './dto/setup-status.output';
import { SetupStatusService } from './setup-status.service';

@Resolver(() => SetupStatus)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class SetupStatusResolver {
  constructor(private readonly service: SetupStatusService) {}

  /**
   * Read-only progress of the initial setup, scoped to the session's org.
   *
   * No @Permissions() guard on purpose: it exposes nothing but counts of the
   * caller's own organisation, and every member benefits from seeing why the
   * app looks empty. The links behind each step lead to pages that carry their
   * own permission checks.
   */
  @Query(() => SetupStatus, { name: 'organizationSetupStatus' })
  getSetupStatus(@CurrentOrgId() orgId: string) {
    return this.service.getStatus(orgId);
  }
}
