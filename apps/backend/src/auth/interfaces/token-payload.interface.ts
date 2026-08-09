import { Persona } from '@/common/enums/persona.enum';
import type { FieldAction } from '@restart/shared-schemas/rbac/field-catalog';

export interface TokenPayload {
  sub: string; // User-ID
  orgId?: string; // aktuelle Organisation (undefined for SuperAdmin without org context)
  membershipId?: string; // Membership-Relation
  persona?: Persona; // z. B. ADMIN, EMPLOYEE
  roles?: string[]; // SystemRole[] oder Custom Roles
  permissions?: string[]; // optional
  fieldPermissions?: Map<string, Set<FieldAction>>; // key: "resource.field"
  isSuperAdmin?: boolean;
  iat?: number;
  exp?: number;
}
