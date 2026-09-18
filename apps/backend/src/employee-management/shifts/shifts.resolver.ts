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
import { ShiftsService } from './shifts.service';
import { Shift } from './entities/shift.entity';
import { CreateShiftInput } from './dto/create-shift.input';
import { UpdateShiftInput } from './dto/update-shift.input';
import { SetTeamShiftsInput } from './dto/set-team-shifts.input';

/**
 * Reading shifts needs only TIMESHEET_READ (every employee sees their team's
 * shifts); defining them and assigning them to teams is SHIFT_MANAGE.
 */
@Resolver(() => Shift)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class ShiftsResolver {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Query(() => [Shift], { name: 'shifts' })
  @Permissions('TIMESHEET_READ')
  shifts(@CurrentOrgId() orgId: string) {
    return this.shiftsService.findAll(orgId);
  }

  @Query(() => [Shift], { name: 'teamShifts' })
  @Permissions('TIMESHEET_READ')
  teamShifts(
    @Args('teamId', { type: () => ID }) teamId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.shiftsService.findForTeam(teamId, orgId);
  }

  /** Teams (of the caller's org) this shift is assigned to. */
  @ResolveField(() => [ID], { name: 'teamIds' })
  async teamIds(
    @Parent() shift: Shift,
    @CurrentOrgId() orgId: string,
  ): Promise<string[]> {
    const map = await this.shiftsService.teamIdsByShift([shift.id], orgId);
    return map.get(shift.id) ?? [];
  }

  @Mutation(() => Shift)
  @Permissions('SHIFT_MANAGE')
  createShift(
    @Args('input') input: CreateShiftInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.shiftsService.create(input, orgId);
  }

  @Mutation(() => Shift)
  @Permissions('SHIFT_MANAGE')
  updateShift(
    @Args('input') input: UpdateShiftInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.shiftsService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('SHIFT_MANAGE')
  deleteShift(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.shiftsService.remove(id, orgId);
  }

  @Mutation(() => [Shift])
  @Permissions('SHIFT_MANAGE')
  setTeamShifts(
    @Args('input') input: SetTeamShiftsInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.shiftsService.setTeamShifts(input, orgId);
  }
}
