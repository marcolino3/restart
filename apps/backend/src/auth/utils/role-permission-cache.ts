// Org-scoped in-memory cache for role -> permission and role -> field
// permission lookups. get-auth-context.util.ts already runs once per request
// (populated onto req.user by the auth guards); this cache removes the two
// remaining uncached queries (permissions, field permissions) from that path
// as long as the org's roles have not changed since the cache was filled.
//
// Invalidation: versioned by MAX(roles.updated_at) per org, read via a single
// cheap query. No TTL guessing, no cross-pod invalidation — every pod reads
// the same version from the DB, so a role edit on any pod is visible to all
// pods on their next request.
import { EntityManager } from 'typeorm';

import { Permission } from '@/permissions/entities/permission.entity';
import { Role } from '@/roles/entities/role.entity';
import { RoleFieldPermission } from '@/roles/entities/role-field-permission.entity';
import {
  protectedFieldKey,
  type FieldAction,
} from '@restart/shared-schemas/rbac/field-catalog';

type OrgRoleCacheEntry = {
  version: string;
  permissionsByRole: Map<string, string[]>; // roleId -> Permission.code[]
  fieldPermissionsByRole: Map<string, Map<string, Set<FieldAction>>>; // roleId -> "resource.field" -> actions
};

const cacheByOrg = new Map<string, OrgRoleCacheEntry>();

async function loadOrgRoleVersion(
  em: EntityManager,
  orgId: string,
): Promise<string> {
  // Two independent tables can change a role's effective rights: `roles`
  // (permission ManyToMany, name/isSystem) and `role_field_permissions`
  // (its own updated_at, not reflected on the parent role row). Version must
  // be the max across both, or a field-permission-only edit would go unseen.
  const row = await em
    .createQueryBuilder(Role, 'r')
    .leftJoin(RoleFieldPermission, 'rfp', 'rfp.role_id = r.id')
    .where('r.organization_id = :orgId', { orgId })
    .select('GREATEST(MAX(r.updatedAt), MAX(rfp.updatedAt))', 'maxUpdatedAt')
    .getRawOne<{ maxUpdatedAt: Date | null }>();
  return row?.maxUpdatedAt ? row.maxUpdatedAt.toISOString() : 'empty';
}

async function loadOrgRoleCacheEntry(
  em: EntityManager,
  orgId: string,
  version: string,
): Promise<OrgRoleCacheEntry> {
  const permissionsByRole = new Map<string, string[]>();
  const permRows = await em
    .createQueryBuilder(Permission, 'p')
    .innerJoin('role_permissions', 'rp', 'rp.permission_id = p.id')
    .innerJoin(Role, 'r', 'r.id = rp.role_id')
    .where('r.organization_id = :orgId', { orgId })
    .select('rp.role_id', 'roleId')
    .addSelect('p.code', 'code')
    .getRawMany<{ roleId: string; code: string }>();
  for (const row of permRows) {
    const codes = permissionsByRole.get(row.roleId) ?? [];
    codes.push(row.code);
    permissionsByRole.set(row.roleId, codes);
  }

  const fieldPermissionsByRole = new Map<
    string,
    Map<string, Set<FieldAction>>
  >();
  const fieldRows = await em
    .createQueryBuilder(RoleFieldPermission, 'rfp')
    .innerJoin(Role, 'r', 'r.id = rfp.role_id')
    .where('r.organization_id = :orgId', { orgId })
    .getMany();
  for (const row of fieldRows) {
    const byField =
      fieldPermissionsByRole.get(row.roleId) ??
      new Map<string, Set<FieldAction>>();
    const key = protectedFieldKey(row.resource, row.field);
    const existing = byField.get(key) ?? new Set<FieldAction>();
    for (const action of row.actions) existing.add(action);
    byField.set(key, existing);
    fieldPermissionsByRole.set(row.roleId, byField);
  }

  return { version, permissionsByRole, fieldPermissionsByRole };
}

export async function getOrgRoleCacheEntry(
  em: EntityManager,
  orgId: string,
): Promise<OrgRoleCacheEntry> {
  const version = await loadOrgRoleVersion(em, orgId);
  const cached = cacheByOrg.get(orgId);
  if (cached && cached.version === version) {
    return cached;
  }
  const entry = await loadOrgRoleCacheEntry(em, orgId, version);
  cacheByOrg.set(orgId, entry);
  return entry;
}

export function resolvePermissionsForRoles(
  entry: OrgRoleCacheEntry,
  roleIds: string[],
): string[] {
  const codes = new Set<string>();
  for (const roleId of roleIds) {
    for (const code of entry.permissionsByRole.get(roleId) ?? []) {
      codes.add(code);
    }
  }
  return Array.from(codes);
}

export function resolveFieldPermissionsForRoles(
  entry: OrgRoleCacheEntry,
  roleIds: string[],
): Map<string, Set<FieldAction>> {
  const result = new Map<string, Set<FieldAction>>();
  for (const roleId of roleIds) {
    for (const [key, actions] of entry.fieldPermissionsByRole.get(roleId) ??
      []) {
      const existing = result.get(key) ?? new Set<FieldAction>();
      for (const action of actions) existing.add(action);
      result.set(key, existing);
    }
  }
  return result;
}

// Test-only: clears the module-level cache between test cases/orgs.
export function __clearOrgRoleCacheForTests(): void {
  cacheByOrg.clear();
}
