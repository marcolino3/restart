import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { MembershipGuard } from '@/auth/guard/membership.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CreateEmployeeAbsenceNoticeInput } from './dto/create-employee-absence-notice.input';
import { EmployeeAbsencesService } from './employee-absences.service';
import { EmployeeAbsence } from './entities/employee-absence.entity';

@Resolver(() => EmployeeAbsence)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class EmployeeAbsencesResolver {
  constructor(
    private readonly employeeAbsencesService: EmployeeAbsencesService,
  ) {}

  // Self-service notice (always for the caller's own membership) — no
  // permission code required, but the caller must be a verified member of
  // the active organization.
  @Mutation(() => EmployeeAbsence, { name: 'createEmployeeAbsenceNotice' })
  @UseGuards(MembershipGuard)
  createEmployeeAbsenceNotice(
    @Args('createEmployeeAbsenceInput')
    input: CreateEmployeeAbsenceNoticeInput,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.employeeAbsencesService.createEmployeeAbsenceNotice(
      input,
      user,
    );
  }
}
