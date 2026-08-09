import { SetMetadata } from '@nestjs/common';
import type { FieldAction } from '@restart/shared-schemas/rbac/field-catalog';

// Marks a create/update resolver with the field-catalog resource name its
// input DTO writes to, so FieldWriteGuard can check the input against
// PROTECTED_FIELD_CATALOG before the resolver runs. Resource name must match
// the GraphQL type name in lowerCamelCase (see field-catalog.ts).
export const FIELD_WRITE_RESOURCE_KEY = 'fieldWriteResource';

export type FieldWriteResourceMeta = {
  resource: string;
  action: FieldAction;
};

export const FieldWriteResource = (resource: string, action: FieldAction) =>
  SetMetadata(FIELD_WRITE_RESOURCE_KEY, { resource, action });
