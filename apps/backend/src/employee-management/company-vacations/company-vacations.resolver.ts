import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CompanyVacationsService } from './company-vacations.service';
import { CompanyVacation } from './entities/company-vacation.entity';
import { CreateCompanyVacationInput } from './dto/create-company-vacation.input';
import { UpdateCompanyVacationInput } from './dto/update-company-vacation.input';
import { CompanyVacationHoliday } from './entities/company-vacation-holiday.entity';

@Resolver(() => CompanyVacation)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class CompanyVacationsResolver {
  constructor(private readonly service: CompanyVacationsService) {}

  @Query(() => [CompanyVacation], { name: 'companyVacations' })
  @Permissions('TIMESHEET_READ')
  companyVacations(@CurrentOrgId() orgId: string) {
    return this.service.findAll(orgId);
  }

  /** Feiertage im Zeitraum — Anzahl und Auflistung für die Tabellenanzeige. */
  @ResolveField(() => [CompanyVacationHoliday], { name: 'holidays' })
  holidays(
    @Parent() vacation: CompanyVacation,
    @CurrentOrgId() orgId: string,
  ): Promise<CompanyVacationHoliday[]> {
    return this.service.findHolidaysInRange(
      orgId,
      vacation.startDate,
      vacation.endDate,
    );
  }

  @Mutation(() => CompanyVacation)
  @Permissions('EMPLOYEE_WRITE')
  createCompanyVacation(
    @Args('input') input: CreateCompanyVacationInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.create(input, orgId);
  }

  @Mutation(() => CompanyVacation)
  @Permissions('EMPLOYEE_WRITE')
  updateCompanyVacation(
    @Args('input') input: UpdateCompanyVacationInput,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.update(input, orgId);
  }

  @Mutation(() => Boolean)
  @Permissions('EMPLOYEE_WRITE')
  deleteCompanyVacation(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.service.remove(id, orgId);
  }
}
