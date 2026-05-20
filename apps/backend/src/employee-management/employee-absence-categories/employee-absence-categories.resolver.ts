import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';
import { EmployeeAbsenceCategoriesService } from './employee-absence-categories.service';
import { EmployeeAbsenceCategory } from './entities/employee-absence-category.entity';
import { EmployeeAbsenceCategoryTranslation } from './entities/employee-absence-category-translation.entity';
import { CreateEmployeeAbsenceCategoryInput } from './dto/create-employee-absence-category.input';
import { UpdateEmployeeAbsenceCategoryInput } from './dto/update-employee-absence-category.input';
import { UpsertEmployeeAbsenceCategoryTranslationInput } from './dto/upsert-employee-absence-category-translation.input';

@Resolver(() => EmployeeAbsenceCategory)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class EmployeeAbsenceCategoriesResolver {
  constructor(private readonly service: EmployeeAbsenceCategoriesService) {}

  @Mutation(() => Boolean, { name: 'seedSystemEmployeeAbsenceCategories' })
  @UseGuards(SuperAdminGuard)
  async seedSystemEmployeeAbsenceCategories(
    @Args('orgId', { type: () => ID }) orgId: string,
  ): Promise<boolean> {
    await this.service.seedOrgEmployeeAbsenceCategories(orgId);
    return true;
  }

  /**
   * Setzt alle System-Kategorien-Translations einer Org auf die aktuellen
   * Code-Defaults zurueck. Custom-Kategorien werden nicht angefasst.
   * Manuelle Anpassungen an System-Namen werden ueberschrieben.
   */
  @Mutation(() => Boolean, {
    name: 'resyncSystemEmployeeAbsenceCategoryTranslations',
  })
  @UseGuards(SuperAdminGuard)
  async resyncSystemEmployeeAbsenceCategoryTranslations(
    @Args('orgId', { type: () => ID }) orgId: string,
  ): Promise<boolean> {
    await this.service.resyncSystemTranslations(orgId);
    return true;
  }

  @Query(() => [EmployeeAbsenceCategory], {
    name: 'employeeAbsenceCategoriesByOrgId',
  })
  @Permissions('EMPLOYEE_ABSENCE_CATEGORY_READ')
  findEmployeeAbsenceCategoriesByOrgId(@CurrentOrgId() orgId: string) {
    return this.service.findEmployeeAbsenceCategoriesByOrgId(orgId);
  }

  @Query(() => EmployeeAbsenceCategory, { name: 'employeeAbsenceCategoryById' })
  @Permissions('EMPLOYEE_ABSENCE_CATEGORY_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.findOne(id, orgId);
  }

  @Mutation(() => EmployeeAbsenceCategory)
  @Permissions('EMPLOYEE_ABSENCE_CATEGORY_MANAGE')
  createEmployeeAbsenceCategory(
    @Args('input') input: CreateEmployeeAbsenceCategoryInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.create(input, orgId);
  }

  @Mutation(() => EmployeeAbsenceCategory)
  @Permissions('EMPLOYEE_ABSENCE_CATEGORY_MANAGE')
  updateEmployeeAbsenceCategory(
    @Args('input') input: UpdateEmployeeAbsenceCategoryInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('EMPLOYEE_ABSENCE_CATEGORY_MANAGE')
  archiveEmployeeAbsenceCategory(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.archive(id, orgId);
  }

  @Mutation(() => [EmployeeAbsenceCategory])
  @Permissions('EMPLOYEE_ABSENCE_CATEGORY_MANAGE')
  reorderEmployeeAbsenceCategories(
    @Args('ids', { type: () => [ID] }) ids: string[],
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.reorder(ids, orgId);
  }

  @Mutation(() => EmployeeAbsenceCategory)
  @Permissions('EMPLOYEE_ABSENCE_CATEGORY_MANAGE')
  setEmployeeAbsenceCategoryActive(
    @Args('id', { type: () => ID }) id: string,
    @Args('isActive', { type: () => Boolean }) isActive: boolean,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.setActive(id, orgId, isActive);
  }

  @Mutation(() => EmployeeAbsenceCategoryTranslation)
  @Permissions('EMPLOYEE_ABSENCE_CATEGORY_MANAGE')
  upsertEmployeeAbsenceCategoryTranslation(
    @Args('input') input: UpsertEmployeeAbsenceCategoryTranslationInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.upsertTranslation(input, orgId);
  }
}
