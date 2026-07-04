import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentMembershipIdOptional } from '@/auth/decorators/current-membership-id-optional.decorator';
import { DataSubjectRequestsService } from './data-subject-requests.service';
import { DataSubjectRequest } from './entities/data-subject-request.entity';
import { CreateDataSubjectRequestInput } from './dto/create-data-subject-request.input';
import { UpdateDataSubjectRequestInput } from './dto/update-data-subject-request.input';
import { DataSubjectRequestStatus } from './enums/data-subject-request-status.enum';

@Resolver(() => DataSubjectRequest)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class DataSubjectRequestsResolver {
  constructor(private readonly requestsService: DataSubjectRequestsService) {}

  @Query(() => [DataSubjectRequest], { name: 'dataSubjectRequests' })
  @Permissions('DATA_REQUEST_READ')
  findAll(
    @CurrentOrgId() orgId: string,
    @Args('status', {
      type: () => DataSubjectRequestStatus,
      nullable: true,
    })
    status?: DataSubjectRequestStatus,
  ) {
    return this.requestsService.findAllByOrgId(orgId, status);
  }

  @Query(() => DataSubjectRequest, { name: 'dataSubjectRequestById' })
  @Permissions('DATA_REQUEST_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.requestsService.findOne(id, orgId);
  }

  @Mutation(() => DataSubjectRequest)
  @Permissions('DATA_REQUEST_MANAGE')
  createDataSubjectRequest(
    @Args('input') input: CreateDataSubjectRequestInput,
    @CurrentOrgId() orgId: string,
    @CurrentMembershipIdOptional() membershipId: string | null,
  ) {
    return this.requestsService.create(input, orgId, membershipId);
  }

  @Mutation(() => DataSubjectRequest)
  @Permissions('DATA_REQUEST_MANAGE')
  updateDataSubjectRequest(
    @Args('input') input: UpdateDataSubjectRequestInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.requestsService.update(input, orgId);
  }
}
