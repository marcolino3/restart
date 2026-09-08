import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { ShiftPlansService } from './shift-plans.service';
import { ShiftCoverageRequirement } from './entities/shift-coverage-requirement.entity';
import { ShiftPlan } from './entities/shift-plan.entity';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { ShiftPlanStatus } from './entities/shift-plan-enums';
import {
  ShiftPlanDetail,
  ShiftPlanTeam,
} from './entities/shift-plan-detail.type';
import { SetShiftCoverageInput } from './dto/set-shift-coverage.input';
import { CreateShiftPlanInput } from './dto/create-shift-plan.input';
import { SetShiftAssignmentsInput } from './dto/set-shift-assignments.input';

@Resolver(() => ShiftPlan)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ShiftPlansResolver {
  constructor(private readonly service: ShiftPlansService) {}

  @Query(() => [ShiftPlanTeam], { name: 'shiftPlanTeams' })
  @Permissions('SHIFT_PLAN_READ')
  shiftPlanTeams(
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
  ): Promise<ShiftPlanTeam[]> {
    return this.service.plannableTeams(user, orgId);
  }

  @Query(() => [ShiftCoverageRequirement], { name: 'shiftCoverage' })
  @Permissions('SHIFT_PLAN_READ')
  shiftCoverage(
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
    @Args('teamId', { type: () => ID }) teamId: string,
  ): Promise<ShiftCoverageRequirement[]> {
    return this.service.coverageForTeam(user, orgId, teamId);
  }

  @Mutation(() => [ShiftCoverageRequirement])
  @Permissions('SHIFT_MANAGE')
  setShiftCoverage(
    @CurrentOrgId() orgId: string,
    @Args('input') input: SetShiftCoverageInput,
  ): Promise<ShiftCoverageRequirement[]> {
    return this.service.setCoverage(orgId, input);
  }

  @Query(() => [ShiftPlan], { name: 'shiftPlans' })
  @Permissions('SHIFT_PLAN_READ')
  shiftPlans(
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
    @Args('teamId', { type: () => ID, nullable: true }) teamId?: string,
  ): Promise<ShiftPlan[]> {
    return this.service.listPlans(user, orgId, teamId ?? null);
  }

  @Query(() => ShiftPlanDetail, { name: 'shiftPlan' })
  @Permissions('SHIFT_PLAN_READ')
  shiftPlan(
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ShiftPlanDetail> {
    return this.service.planDetail(user, orgId, id);
  }

  @Query(() => [ShiftAssignment], { name: 'myShiftAssignments' })
  @Permissions('SHIFT_PLAN_READ')
  myShiftAssignments(
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
    @Args('from') from: string,
    @Args('to') to: string,
  ): Promise<ShiftAssignment[]> {
    return this.service.myAssignments(user, orgId, from, to);
  }

  @Mutation(() => ShiftPlan)
  @Permissions('SHIFT_PLAN_WRITE')
  createShiftPlan(
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
    @Args('input') input: CreateShiftPlanInput,
  ): Promise<ShiftPlan> {
    return this.service.createPlan(user, orgId, input);
  }

  @Mutation(() => [ShiftAssignment])
  @Permissions('SHIFT_PLAN_WRITE')
  setShiftAssignments(
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
    @Args('input') input: SetShiftAssignmentsInput,
  ): Promise<ShiftAssignment[]> {
    return this.service.setAssignments(user, orgId, input);
  }

  @Mutation(() => ShiftPlan)
  @Permissions('SHIFT_PLAN_WRITE')
  publishShiftPlan(
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ShiftPlan> {
    return this.service.setStatus(user, orgId, id, ShiftPlanStatus.PUBLISHED);
  }

  @Mutation(() => ShiftPlan)
  @Permissions('SHIFT_PLAN_WRITE')
  unpublishShiftPlan(
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ShiftPlan> {
    return this.service.setStatus(user, orgId, id, ShiftPlanStatus.DRAFT);
  }

  @Mutation(() => Boolean)
  @Permissions('SHIFT_PLAN_WRITE')
  deleteShiftPlan(
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.service.deletePlan(user, orgId, id);
  }
}
