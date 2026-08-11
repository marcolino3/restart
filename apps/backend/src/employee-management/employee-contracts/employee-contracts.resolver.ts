import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { protectedFieldKey } from '@restart/shared-schemas/rbac/field-catalog';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { FieldWriteGuard } from '@/auth/guard/field-write.guard';
import { FieldWriteResource } from '@/auth/decorators/field-write-resource.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { CurrentOrgId } from '@/auth/decorators/current-org-id.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { EmployeeContractsService } from './employee-contracts.service';
import { EmployeeContract } from './entities/employee-contract.entity';
import { CreateEmployeeContractInput } from './dto/create-employee-contract.input';
import { UpdateEmployeeContractInput } from './dto/update-employee-contract.input';
import type { ContractTypeDependentField } from './contract-type-rules';

/**
 * Contract-type-dependent fields the caller cannot read count as absent for
 * the "required" check too — they can never appear in the caller's input, so
 * the backend must not reject the contract for missing them (mirrors the
 * frontend exemption in buildEmployeeContractFormSchema).
 */
const CONTRACT_FIELD_PERMISSION_KEYS: ContractTypeDependentField[] = [
  'grossSalary',
  'hourlyRate',
  'paymentInterval',
  'has13thSalary',
];

export function hiddenByPermission(
  user: TokenPayload | undefined,
): ReadonlySet<ContractTypeDependentField> | undefined {
  if (user?.isSuperAdmin || !user?.fieldPermissions) return undefined;
  const hidden = new Set<ContractTypeDependentField>();
  for (const field of CONTRACT_FIELD_PERMISSION_KEYS) {
    const key = protectedFieldKey('employeeContract', field);
    if (!user.fieldPermissions.get(key)?.has('read')) {
      hidden.add(field);
    }
  }
  return hidden;
}

@Resolver(() => EmployeeContract)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class EmployeeContractsResolver {
  constructor(
    private readonly employeeContractsService: EmployeeContractsService,
  ) {}

  @Query(() => [EmployeeContract], { name: 'employeeContractsByOrgId' })
  @Permissions('EMPLOYEE_READ')
  findAll(@CurrentOrgId() orgId: string) {
    return this.employeeContractsService.findAllByOrgId(orgId);
  }

  @Query(() => [EmployeeContract], { name: 'employeeContractsByEmployeeId' })
  @Permissions('EMPLOYEE_READ')
  findAllByEmployee(
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeeContractsService.findAllByEmployeeId(employeeId, orgId);
  }

  @Query(() => EmployeeContract, { name: 'employeeContractById' })
  @Permissions('EMPLOYEE_READ')
  findOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeeContractsService.findOne(id, orgId);
  }

  @Mutation(() => EmployeeContract)
  @Permissions('EMPLOYEE_WRITE')
  @UseGuards(FieldWriteGuard)
  @FieldWriteResource('employeeContract', 'create')
  createEmployeeContract(
    @Args('input') input: CreateEmployeeContractInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.employeeContractsService.create(
      input,
      orgId,
      hiddenByPermission(user),
    );
  }

  @Mutation(() => EmployeeContract)
  @Permissions('EMPLOYEE_WRITE')
  @UseGuards(FieldWriteGuard)
  @FieldWriteResource('employeeContract', 'update')
  updateEmployeeContract(
    @Args('input') input: UpdateEmployeeContractInput,
    @CurrentOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.employeeContractsService.update(
      input,
      orgId,
      hiddenByPermission(user),
    );
  }

  @Mutation(() => Boolean)
  @Permissions('EMPLOYEE_WRITE')
  deleteEmployeeContract(
    @Args('id', { type: () => ID }) id: string,
    @CurrentOrgId() orgId: string,
  ) {
    return this.employeeContractsService.remove(id, orgId);
  }
}
