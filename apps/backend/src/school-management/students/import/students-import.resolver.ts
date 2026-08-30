import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { ImportStudentsInput } from './dto/import-students.input';
import { StudentImportResultType } from './dto/student-import-plan.types';
import { StudentsImportService } from './students-import.service';

@Resolver(() => StudentImportResultType)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class StudentsImportResolver {
  constructor(private readonly service: StudentsImportService) {}

  @Mutation(() => StudentImportResultType)
  @Permissions('STUDENT_WRITE', 'CONTACT_PERSON_WRITE')
  importStudents(
    @Args('input') input: ImportStudentsInput,
    @CurrentOrgId() orgId: string,
  ): Promise<StudentImportResultType> {
    return this.service.applyPlan(input, orgId);
  }
}
