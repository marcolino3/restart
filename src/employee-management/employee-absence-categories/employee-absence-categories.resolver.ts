import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { EmployeeAbsenceCategoriesService } from './employee-absence-categories.service';
import { EmployeeAbsenceCategory } from './entities/employee-absence-category.entity';
import { UseGuards } from '@nestjs/common';
import { GqlJwtAuthGuard } from '@/auth/guard/gql-jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

@Resolver(() => EmployeeAbsenceCategory)
export class EmployeeAbsenceCategoriesResolver {
  constructor(
    private readonly employeeAbsenceCategoriesService: EmployeeAbsenceCategoriesService,
  ) {}

  @Mutation(() => EmployeeAbsenceCategory, {
    name: 'seedSystemEmployeeAbsenceCategories',
  })
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
  @UseGuards(GqlJwtAuthGuard)
  findEmployeeAbsenceCategoriesByOrgId(@CurrentUser() user: TokenPayload) {
    const organizationId = user.orgId;
    return this.employeeAbsenceCategoriesService.findEmployeeAbsenceCategoriesByOrgId(
      organizationId,
    );
  }
}
