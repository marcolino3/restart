// GraphQL field-level read enforcement. Registered globally via
// GraphQLModule `fieldResolverEnhancers`/`buildSchemaOptions.fieldMiddleware`.
// Only fields listed in PROTECTED_FIELD_KEYS incur any check (O(1) Set
// lookup) — all other fields resolve untouched.
import type { MiddlewareContext, NextFn } from '@nestjs/graphql';
import type { Request } from 'express';

import {
  protectedFieldKey,
  PROTECTED_FIELD_KEYS,
} from '@restart/shared-schemas/rbac/field-catalog';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

const PRIVATE_USER_FIELDS = new Set([
  'dateOfBirth',
  'socialSecurityNumber',
  'privateEmail',
  'street',
  'houseNumber',
  'addressLine2',
  'postalCode',
  'city',
  'country',
]);

function resourceNameFromGraphQLType(typeName: string): string {
  return typeName.charAt(0).toLowerCase() + typeName.slice(1);
}

export const fieldPermissionMiddleware = async (
  ctx: MiddlewareContext,
  next: NextFn,
) => {
  const parentTypeName = ctx.info.parentType.name;
  const fieldName = ctx.info.fieldName;
  const resource = resourceNameFromGraphQLType(parentTypeName);
  const key = protectedFieldKey(resource, fieldName);

  const caller = ctx.context?.req?.user as TokenPayload | undefined;
  if (
    parentTypeName === 'Employee' &&
    fieldName === 'profile' &&
    (!caller?.orgId ||
      ctx.source?.organizationId !== caller.orgId ||
      (!caller.isSuperAdmin && !caller.permissions?.includes('EMPLOYEE_READ')))
  )
    return null;
  if (
    parentTypeName === 'User' &&
    fieldName === 'userEmails' &&
    !caller?.isSuperAdmin &&
    caller?.sub !== ctx.source?.id
  )
    return [];
  if (parentTypeName === 'User' && PRIVATE_USER_FIELDS.has(fieldName)) {
    if (!caller || (!caller.isSuperAdmin && caller.sub !== ctx.source?.id)) {
      return null;
    }
  }

  if (!PROTECTED_FIELD_KEYS.has(key)) {
    return next();
  }

  const req = ctx.context?.req as
    (Request & { user?: TokenPayload }) | undefined;
  const user = req?.user;

  if (user?.isSuperAdmin) {
    return next();
  }

  const allowedActions = user?.fieldPermissions?.get(key);
  if (!allowedActions?.has('read')) {
    return null;
  }

  return next();
};
