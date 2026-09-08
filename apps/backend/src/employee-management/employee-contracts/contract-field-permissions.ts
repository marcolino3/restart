import { protectedFieldKey } from '@restart/shared-schemas/rbac/field-catalog';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import type { ContractTypeDependentField } from './contract-type-rules';

/**
 * Contract fields that are protected by field-level RBAC. Callers without
 * `read` on any of these are treated as if the field was hidden: it is
 * cleared from writes and exempt from the "required" check too — they can
 * never appear in the caller's input, so the backend must not reject the
 * contract for missing them (mirrors the frontend exemption in
 * buildEmployeeContractFormSchema).
 */
export const CONTRACT_FIELD_PERMISSION_KEYS: ContractTypeDependentField[] = [
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
