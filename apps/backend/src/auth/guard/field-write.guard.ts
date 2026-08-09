// Enforces field-level write permissions on create/update mutations.
// Complements fieldPermissionMiddleware (read-side): forbidden fields in the
// input throw ForbiddenException instead of being silently dropped — the
// client must know the write did not happen as requested.
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';

import {
  protectedFieldKey,
  PROTECTED_FIELD_CATALOG,
} from '@restart/shared-schemas/rbac/field-catalog';
import {
  FIELD_WRITE_RESOURCE_KEY,
  type FieldWriteResourceMeta,
} from '@/auth/decorators/field-write-resource.decorator';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

const PROTECTED_FIELDS_BY_RESOURCE = new Map<string, Set<string>>();
for (const entry of PROTECTED_FIELD_CATALOG) {
  const set = PROTECTED_FIELDS_BY_RESOURCE.get(entry.resource) ?? new Set();
  set.add(entry.field);
  PROTECTED_FIELDS_BY_RESOURCE.set(entry.resource, set);
}

@Injectable()
export class FieldWriteGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const meta = this.reflector.getAllAndOverride<
      FieldWriteResourceMeta | undefined
    >(FIELD_WRITE_RESOURCE_KEY, [context.getHandler(), context.getClass()]);
    if (!meta) return true;
    const { resource, action } = meta;

    const protectedFields = PROTECTED_FIELDS_BY_RESOURCE.get(resource);
    if (!protectedFields?.size) return true;

    const gqlCtx = GqlExecutionContext.create(context);
    const args = gqlCtx.getArgs<Record<string, unknown>>();
    const req = gqlCtx.getContext<{ req: Request & { user?: TokenPayload } }>()
      .req;
    const user = req?.user;

    if (user?.isSuperAdmin) return true;

    const input = (args.input ?? args.data ?? args) as Record<string, unknown>;

    for (const field of Object.keys(input)) {
      if (!protectedFields.has(field)) continue;
      const key = protectedFieldKey(resource, field);
      if (!user?.fieldPermissions?.get(key)?.has(action)) {
        throw new ForbiddenException(
          `Access denied for field "${resource}.${field}" (${action})`,
        );
      }
    }

    return true;
  }
}
