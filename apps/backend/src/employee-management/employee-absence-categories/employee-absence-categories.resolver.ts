import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { EmployeeAbsenceCategoriesService } from './employee-absence-categories.service';
import { EmployeeAbsenceCategory } from './entities/employee-absence-category.entity';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

@Resolver(() => EmployeeAbsenceCategory)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class EmployeeAbsenceCategoriesResolver {
  constructor(
    private readonly employeeAbsenceCategoriesService: EmployeeAbsenceCategoriesService,
  ) {}

  @Mutation(() => EmployeeAbsenceCategory, {
    name: 'seedSystemEmployeeAbsenceCategories',
  })
  @UseGuards(SuperAdminGuard)
  seedSystemEmployeeAbsenceCategories(
    @Args('orgId', { type: () => String }) orgId: string,
  ) {
    return this.employeeAbsenceCategoriesService.seedOrgEmployeeAbsenceCategories(
      orgId,
    );
  }

  @Query(() => [EmployeeAbsenceCategory], {
    name: 'employeeAbsenceCategoriesByOrgId',
  })
  findEmployeeAbsenceCategoriesByOrgId(@CurrentUser() user: TokenPayload) {
    const organizationId = user.orgId!;
    return this.employeeAbsenceCategoriesService.findEmployeeAbsenceCategoriesByOrgId(
      organizationId,
    );
  }
}
