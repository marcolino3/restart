import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { AdminPersonaOnly } from '@/auth/decorators/admin-persona-only.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { EmployeeNote } from './entities/employee-note.entity';
import { EmployeeNotesService } from './employee-notes.service';
import { CreateEmployeeNoteInput } from './dto/create-employee-note.input';
import { UpdateEmployeeNoteInput } from './dto/update-employee-note.input';

@Resolver(() => EmployeeNote)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
@AdminPersonaOnly()
export class EmployeeNotesResolver {
  constructor(
    private readonly employeeNotesService: EmployeeNotesService,
  ) {}

  @Mutation(() => EmployeeNote, { name: 'createEmployeeNote' })
  @Permissions('EMPLOYEE_WRITE')
  createEmployeeNote(
    @Args('createEmployeeNoteInput') input: CreateEmployeeNoteInput,
    @CurrentUser() user: TokenPayload,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeeNotesService.createNote(
      input,
      user.membershipId,
      orgId,
    );
  }

  @Query(() => [EmployeeNote], { name: 'employeeNotesByEmployeeId' })
  @Permissions('EMPLOYEE_READ')
  findNotesByEmployeeId(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeeNotesService.findNotesByEmployeeId(employeeId, orgId);
  }

  @Mutation(() => EmployeeNote, { name: 'updateEmployeeNote' })
  @Permissions('EMPLOYEE_WRITE')
  updateEmployeeNote(
    @Args('updateEmployeeNoteInput') input: UpdateEmployeeNoteInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeeNotesService.updateNote(input, orgId);
  }

  @Mutation(() => EmployeeNote, { name: 'softDeleteEmployeeNote' })
  @Permissions('EMPLOYEE_WRITE')
  softDeleteEmployeeNote(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeeNotesService.softDeleteNote(id, orgId);
  }
}
