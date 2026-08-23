import { registerEnumType } from '@nestjs/graphql';

/**
 * Approval state of an absence. Persisted as a plain varchar (not a PG enum)
 * so a new state never needs `ALTER TYPE … ADD VALUE` — see the 55P04 rule in
 * CLAUDE.md. Existing rows default to APPROVED because before the approval
 * workflow every absence was definitive.
 */
export enum EmployeeAbsenceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

registerEnumType(EmployeeAbsenceStatus, { name: 'EmployeeAbsenceStatus' });
