import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { EmployeeVacationsService } from './employee-vacations.service';
import { EmployeeVacation } from './entities/employee-vacation.entity';
import { CreateEmployeeVacationInput } from './dto/create-employee-vacation.input';
import { UpdateEmployeeVacationInput } from './dto/update-employee-vacation.input';

@Resolver(() => EmployeeVacation)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class EmployeeVacationsResolver {
  constructor(private readonly service: EmployeeVacationsService) {}

  @Query(() => [EmployeeVacation], { name: 'employeeVacations' })
  @Permissions('TIMESHEET_READ')
  employeeVacations(
    @CurrentUser() user: TokenPayload,
    @Args('employeeId', { type: () => ID }) employeeId: string,
  ) {
    return this.service.findByEmployee(user, employeeId);
  }

  @Mutation(() => EmployeeVacation)
  @Permissions('TIMESHEET_WRITE')
  createEmployeeVacation(
    @Args('input') input: CreateEmployeeVacationInput,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.service.create(input, user);
  }

  @Mutation(() => EmployeeVacation)
  @Permissions('TIMESHEET_WRITE')
  updateEmployeeVacation(
    @Args('input') input: UpdateEmployeeVacationInput,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.service.update(input, user);
  }

  @Mutation(() => Boolean)
  @Permissions('TIMESHEET_WRITE')
  deleteEmployeeVacation(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.service.remove(id, user);
  }
}
