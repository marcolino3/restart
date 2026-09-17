import type { Membership } from '@/memberships/entities/membership.entity';
import type { AuditLogChange } from '../employee-audit-log/employee-audit-log.service';
import { EmployeeAuditLogEntityType } from '../employee-audit-log/entities/employee-audit-log.entity';
import type { EmployeeOnboardingInput } from './dto/employee-onboarding.input';
import type { Employee } from './entities/employee.entity';
import type { EmployeeProfile } from './entities/employee-profile';

const PROFILE_FIELDS: (keyof EmployeeProfile)[] = [
  'firstName',
  'lastName',
  'title',
  'dateOfBirth',
  'socialSecurityNumber',
  'privateEmail',
  'street',
  'houseNumber',
  'addressLine2',
  'postalCode',
  'city',
  'country',
  'avatarUrl',
  'language',
  'email',
];

/** Apply an already validated patch; the caller persists it and its audit atomically. */
export function applyEmployeeBasisPatch(
  employee: Employee,
  membership: Membership,
  input: EmployeeOnboardingInput,
): AuditLogChange[] {
  const changes: AuditLogChange[] = [];
  for (const key of PROFILE_FIELDS) {
    if (input[key] === undefined) continue;
    const trimmed = input[key]?.trim() || null;
    const next = key === 'email' && trimmed ? trimmed.toLowerCase() : trimmed;
    const before = employee.profile[key] ?? null;
    if (before === next) continue;
    employee.profile[key] = next;
    changes.push({
      entityType: EmployeeAuditLogEntityType.EMPLOYEE,
      fieldName: key,
      oldValue: before,
      newValue: next,
    });
  }
  for (const key of ['contactPhone', 'contactPhone2', 'language'] as const) {
    if (input[key] === undefined) continue;
    const next = input[key]?.trim() || null;
    const before = membership[key] ?? null;
    if (next !== before) {
      membership[key] = next;
      changes.push({
        entityType: EmployeeAuditLogEntityType.MEMBERSHIP,
        fieldName: key,
        oldValue: before,
        newValue: next,
      });
    }
  }
  if (input.persona !== undefined && input.persona !== membership.persona) {
    changes.push({
      entityType: EmployeeAuditLogEntityType.MEMBERSHIP,
      fieldName: 'persona',
      oldValue: membership.persona,
      newValue: input.persona,
    });
    membership.persona = input.persona;
  }
  if (
    input.timeTrackingEnabled !== undefined &&
    input.timeTrackingEnabled !== employee.timeTrackingEnabled
  ) {
    changes.push({
      entityType: EmployeeAuditLogEntityType.EMPLOYEE,
      fieldName: 'timeTrackingEnabled',
      oldValue: String(employee.timeTrackingEnabled),
      newValue: String(input.timeTrackingEnabled),
    });
    employee.timeTrackingEnabled = input.timeTrackingEnabled;
  }
  return changes;
}
