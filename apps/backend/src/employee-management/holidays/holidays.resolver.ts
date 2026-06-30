import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { AdminPersonaOnly } from '@/auth/decorators/admin-persona-only.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { HolidaysService } from './holidays.service';
import { Holiday } from './entities/holiday.entity';
import { CreateHolidayInput } from './dto/create-holiday.input';
import { UpdateHolidayInput } from './dto/update-holiday.input';

@Resolver(() => Holiday)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class HolidaysResolver {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Query(() => [Holiday], { name: 'holidays' })
  @Permissions('TIMESHEET_READ')
  holidays(@CurrentOrgId() orgId: string) {
    return this.holidaysService.findAll(orgId);
  }

  @Mutation(() => Holiday)
  @AdminPersonaOnly()
  @Permissions('EMPLOYEE_WRITE')
  createHoliday(
    @Args('input') input: CreateHolidayInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.holidaysService.create(input, orgId);
  }

  @Mutation(() => Holiday)
  @AdminPersonaOnly()
  @Permissions('EMPLOYEE_WRITE')
  updateHoliday(
    @Args('input') input: UpdateHolidayInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.holidaysService.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @AdminPersonaOnly()
  @Permissions('EMPLOYEE_WRITE')
  deleteHoliday(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.holidaysService.remove(id, orgId);
  }
}
