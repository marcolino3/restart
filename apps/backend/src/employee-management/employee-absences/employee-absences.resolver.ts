import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CreateEmployeeAbsenceNoticeInput } from './dto/create-employee-absence-notice.input';
import { EmployeeAbsencesService } from './employee-absences.service';
import { EmployeeAbsence } from './entities/employee-absence.entity';

@Resolver(() => EmployeeAbsence)
@UseGuards(GqlJwtAuthGuard)
export class EmployeeAbsencesResolver {
  constructor(
    private readonly employeeAbsencesService: EmployeeAbsencesService,
  ) {}

  @Mutation(() => EmployeeAbsence, { name: 'createEmployeeAbsenceNotice' })
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
