import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { DataBreachesService } from './data-breaches.service';
import { DataBreachIncident } from './entities/data-breach-incident.entity';
import { CreateDataBreachInput } from './dto/create-data-breach.input';
import { UpdateDataBreachInput } from './dto/update-data-breach.input';
import { DataBreachStatus } from './enums/data-breach-status.enum';

@Resolver(() => DataBreachIncident)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class DataBreachesResolver {
  constructor(private readonly breachesService: DataBreachesService) {}

  @Query(() => [DataBreachIncident], { name: 'dataBreaches' })
  @Permissions('DATA_BREACH_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('status', { type: () => DataBreachStatus, nullable: true })
    status?: DataBreachStatus,
  ) {
    return this.breachesService.findAllByOrgId(orgId, status);
  }

  @Query(() => DataBreachIncident, { name: 'dataBreachById' })
  @Permissions('DATA_BREACH_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.breachesService.findOne(id, orgId);
  }

  @Mutation(() => DataBreachIncident)
  @Permissions('DATA_BREACH_MANAGE')
  createDataBreach(
    @Args('input') input: CreateDataBreachInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() membershipId: string | null,
  ) {
    return this.breachesService.create(input, orgId, membershipId);
  }

  @Mutation(() => DataBreachIncident)
  @Permissions('DATA_BREACH_MANAGE')
  updateDataBreach(
    @Args('input') input: UpdateDataBreachInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.breachesService.update(input, orgId);
  }

  /** 72h authority-notification deadline (detectedAt + 72h). */
  @ResolveField(() => Date)
  authorityNotificationDueAt(@Parent() incident: DataBreachIncident) {
    return this.breachesService.computeAuthorityNotificationDue(
      incident.detectedAt,
    );
  }
}
