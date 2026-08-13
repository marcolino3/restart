import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { MembershipGuard } from '@/auth/guard/membership.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { EmployeeAbsence } from '../employee-absences/entities/employee-absence.entity';
import { ReportSickLeaveInput } from './dto/report-sick-leave.input';
import { SickLeaveService } from './sick-leave.service';

@Resolver(() => EmployeeAbsence)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class SickLeaveResolver {
  constructor(private readonly sickLeaveService: SickLeaveService) {}

  /**
   * Self-service sick report — deliberately without a `@Permissions()` code,
   * exactly like `createEmployeeAbsenceNotice`. `MembershipGuard` enforces a
   * verified membership in the active organization; the organization and the
   * employee are taken from the token, so a caller can only report for
   * themselves.
   */
  @Mutation(() => EmployeeAbsence, { name: 'reportSickLeave' })
  @UseGuards(MembershipGuard)
  async reportSickLeave(
    @Args('input') input: ReportSickLeaveInput,
    @CurrentUser() user: TokenPayload,
  ): Promise<EmployeeAbsence> {
    const result = await this.sickLeaveService.reportSickLeave(input, user);
    return result.absence;
  }
}
