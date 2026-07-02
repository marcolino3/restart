import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { WorkTimeBalanceService } from './work-time-balance.service';
import {
  AbsenceCategorySummary,
  EmployeeWorkTimeOverviewRow,
  MonthlyWorkTimeSummary,
  VacationBalance,
  WorkTimeBalance,
} from './dto/work-time-balance.output';

/**
 * Saldo-/Auswertungs-Read-API. Alle Reads aggregieren aus dem Ledger.
 * Self-Endpoints: jeder Mitarbeiter (TIMESHEET_READ). Cross-Employee:
 * service-seitiges Scoping (Admin-Persona → alle; TEAM_LEAD → eigenes Team).
 */
@Resolver()
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class WorkTimeBalanceResolver {
  constructor(private readonly balanceService: WorkTimeBalanceService) {}

  @Query(() => WorkTimeBalance, { name: 'myWorkTimeBalance' })
  @Permissions('TIMESHEET_READ')
  myWorkTimeBalance(
    @CurrentUser() user: TokenPayload,
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
  ) {
    return this.balanceService.getMyBalance(user, from, to);
  }

  @Query(() => VacationBalance, { name: 'myVacationBalance' })
  @Permissions('TIMESHEET_READ')
  myVacationBalance(
    @CurrentUser() user: TokenPayload,
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
  ) {
    return this.balanceService.getMyVacationBalance(user, from, to);
  }

  @Query(() => WorkTimeBalance, { name: 'employeeWorkTimeBalance' })
  @Permissions('TIMESHEET_READ')
  employeeWorkTimeBalance(
    @CurrentUser() user: TokenPayload,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
  ) {
    return this.balanceService.getEmployeeBalance(user, employeeId, from, to);
  }

  @Query(() => [MonthlyWorkTimeSummary], { name: 'employeeMonthlyWorkTime' })
  @Permissions('TIMESHEET_READ')
  employeeMonthlyWorkTime(
    @CurrentUser() user: TokenPayload,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
  ) {
    return this.balanceService.getMonthlySummaries(user, employeeId, from, to);
  }

  @Query(() => VacationBalance, { name: 'employeeVacationBalance' })
  @Permissions('TIMESHEET_READ')
  employeeVacationBalance(
    @CurrentUser() user: TokenPayload,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
  ) {
    return this.balanceService.getVacationBalance(user, employeeId, from, to);
  }

  @Query(() => [String], { name: 'myMissingRecordDays' })
  @Permissions('TIMESHEET_READ')
  myMissingRecordDays(
    @CurrentUser() user: TokenPayload,
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
  ) {
    return this.balanceService.getMyMissingRecordDays(user, from, to);
  }

  @Query(() => [String], { name: 'employeeMissingRecordDays' })
  @Permissions('TIMESHEET_READ')
  employeeMissingRecordDays(
    @CurrentUser() user: TokenPayload,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
  ) {
    return this.balanceService.getMissingRecordDays(user, employeeId, from, to);
  }

  @Query(() => [AbsenceCategorySummary], {
    name: 'employeeAbsenceCategorySummary',
  })
  @Permissions('TIMESHEET_READ')
  employeeAbsenceCategorySummary(
    @CurrentUser() user: TokenPayload,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
    @Args('locale', { type: () => String, nullable: true }) locale?: string,
  ) {
    return this.balanceService.getAbsenceCategorySummaries(
      user,
      employeeId,
      from,
      to,
      locale ?? 'DE',
    );
  }

  @Query(() => [EmployeeWorkTimeOverviewRow], { name: 'teamWorkTimeOverview' })
  @Permissions('TIMESHEET_READ')
  teamWorkTimeOverview(
    @CurrentUser() user: TokenPayload,
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
  ) {
    return this.balanceService.getTeamOverview(user, from, to);
  }
}
