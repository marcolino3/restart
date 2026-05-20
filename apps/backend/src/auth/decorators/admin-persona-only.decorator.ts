import { SetMetadata } from '@nestjs/common';

export const ADMIN_PERSONA_KEY = 'adminPersonaOnly';

// Restricts access to ADMIN_PERSONAS (ADMIN, HR, OFFICE). SuperAdmin still
// passes. Use on resolvers that expose HR-sensitive employee data so teachers
// and other staff personas cannot reach the detail surface even if their role
// happens to include EMPLOYEE_READ.
export const AdminPersonaOnly = () => SetMetadata(ADMIN_PERSONA_KEY, true);
