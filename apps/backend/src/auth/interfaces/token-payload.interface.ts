import { Persona } from '@/common/enums/persona.enum';

export interface TokenPayload {
  sub: string; // User-ID
  orgId: string; // aktuelle Organisation
  membershipId: string; // Membership-Relation
  persona: Persona; // z. B. ADMIN, EMPLOYEE
  roles?: string[]; // SystemRole[] oder Custom Roles
  permissions?: string[]; // optional
  isSuperAdmin?: boolean;
  iat?: number;
  exp?: number;
}
