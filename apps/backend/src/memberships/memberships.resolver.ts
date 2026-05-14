import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Membership } from './entities/membership.entity';
import { MembershipsService } from './memberships.service';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CreateMembershipInput } from './dto/create-membership.input';
import { UpdateMembershipInput } from './dto/update-membership.input';

@Resolver(() => Membership)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class MembershipsResolver {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Mutation(() => Membership)
  @Permissions('USER_INVITE')
  createMembership(
    @Args('createMembershipInput') input: CreateMembershipInput,
  ) {
    return this.membershipsService.create(input);
  }

  @Query(() => [Membership], { name: 'membershipsByOrgId' })
  @Permissions('EMPLOYEE_READ')
  findByOrgId(
    @Args('organizationId', { type: () => ID }) organizationId: string,
  ) {
    return this.membershipsService.findByOrgId(organizationId);
  }

  @Mutation(() => Membership)
  @Permissions('EMPLOYEE_WRITE')
  updateMembership(
    @Args('updateMembershipInput') input: UpdateMembershipInput,
  ) {
    return this.membershipsService.update(input);
  }
}
