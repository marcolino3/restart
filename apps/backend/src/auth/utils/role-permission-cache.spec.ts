import type { FieldAction } from '@restart/shared-schemas/rbac/field-catalog';
import {
  __clearOrgRoleCacheForTests,
  getOrgRoleCacheEntry,
  resolveFieldPermissionsForRoles,
  resolvePermissionsForRoles,
} from './role-permission-cache';

type QueryBuilderStub = {
  leftJoin: () => QueryBuilderStub;
  innerJoin: () => QueryBuilderStub;
  where: () => QueryBuilderStub;
  select: () => QueryBuilderStub;
  addSelect: () => QueryBuilderStub;
  getRawOne: () => Promise<unknown>;
  getRawMany: () => Promise<unknown[]>;
  getMany: () => Promise<unknown[]>;
};

function fakeQueryBuilder(result: {
  rawOne?: unknown;
  rawMany?: unknown[];
  many?: unknown[];
}): QueryBuilderStub {
  const qb: QueryBuilderStub = {
    leftJoin: () => qb,
    innerJoin: () => qb,
    where: () => qb,
    select: () => qb,
    addSelect: () => qb,
    getRawOne: () => Promise.resolve(result.rawOne),
    getRawMany: () => Promise.resolve(result.rawMany ?? []),
    getMany: () => Promise.resolve(result.many ?? []),
  };
  return qb;
}

describe('role-permission-cache', () => {
  beforeEach(() => {
    __clearOrgRoleCacheForTests();
  });

  describe('resolvePermissionsForRoles / resolveFieldPermissionsForRoles', () => {
    it('unions permissions across roles and de-duplicates', () => {
      const entry = {
        version: 'v1',
        permissionsByRole: new Map([
          ['role-a', ['STUDENT_READ', 'EMPLOYEE_READ']],
          ['role-b', ['EMPLOYEE_READ', 'EMPLOYEE_WRITE']],
        ]),
        fieldPermissionsByRole: new Map(),
      };
      const result = resolvePermissionsForRoles(entry, ['role-a', 'role-b']);
      expect(new Set(result)).toEqual(
        new Set(['STUDENT_READ', 'EMPLOYEE_READ', 'EMPLOYEE_WRITE']),
      );
    });

    it('ignores roles not present in the cache entry', () => {
      const entry = {
        version: 'v1',
        permissionsByRole: new Map([['role-a', ['STUDENT_READ']]]),
        fieldPermissionsByRole: new Map(),
      };
      expect(resolvePermissionsForRoles(entry, ['role-a', 'unknown'])).toEqual([
        'STUDENT_READ',
      ]);
    });

    it('unions field-permission actions across roles for the same field', () => {
      const entry = {
        version: 'v1',
        permissionsByRole: new Map(),
        fieldPermissionsByRole: new Map<string, Map<string, Set<FieldAction>>>([
          [
            'role-a',
            new Map([['employee.salary', new Set<FieldAction>(['read'])]]),
          ],
          [
            'role-b',
            new Map([['employee.salary', new Set<FieldAction>(['update'])]]),
          ],
        ]),
      };
      const result = resolveFieldPermissionsForRoles(entry, [
        'role-a',
        'role-b',
      ]);
      expect(result.get('employee.salary')).toEqual(
        new Set(['read', 'update']),
      );
    });
  });

  describe('getOrgRoleCacheEntry', () => {
    // getOrgRoleCacheEntry always issues the version query first; the
    // permission + field-permission queries only follow on a cache miss.
    // A fixed-size queue models that: 1 result on a hit, 3 on a miss.
    function fakeEm(results: unknown[]) {
      const queue = [...results];
      return {
        createQueryBuilder: () => fakeQueryBuilder(queue.shift() as never),
      };
    }

    function versionResult(version: Date | null) {
      return { rawOne: version ? { maxUpdatedAt: version } : null };
    }
    function permsResult(rows: { roleId: string; code: string }[]) {
      return { rawMany: rows };
    }
    function fieldRowsResult(
      rows: {
        roleId: string;
        resource: string;
        field: string;
        actions: string[];
      }[],
    ) {
      return { many: rows };
    }

    it('loads and caches an entry, then reuses it while the version is unchanged', async () => {
      const version = new Date('2026-01-01T00:00:00.000Z');
      const em = fakeEm([
        versionResult(version),
        permsResult([{ roleId: 'role-a', code: 'STUDENT_READ' }]),
        fieldRowsResult([]),
        versionResult(version), // second call: cache hit, only version re-checked
      ]);
      const createSpy = jest.spyOn(em, 'createQueryBuilder');

      const first = await getOrgRoleCacheEntry(em as never, 'org-1');
      expect(first.permissionsByRole.get('role-a')).toEqual(['STUDENT_READ']);
      expect(createSpy).toHaveBeenCalledTimes(3); // version + perms + field-perms

      const second = await getOrgRoleCacheEntry(em as never, 'org-1');
      expect(second).toBe(first); // same object => cache hit, no reload
      expect(createSpy).toHaveBeenCalledTimes(4); // only the version check ran again
    });

    it('reloads when the version changes', async () => {
      const versionOne = new Date('2026-01-01T00:00:00.000Z');
      const versionTwo = new Date('2026-02-01T00:00:00.000Z');
      const em = fakeEm([
        versionResult(versionOne),
        permsResult([]),
        fieldRowsResult([]),
        versionResult(versionTwo),
        permsResult([]),
        fieldRowsResult([]),
      ]);

      const first = await getOrgRoleCacheEntry(em as never, 'org-2');
      const second = await getOrgRoleCacheEntry(em as never, 'org-2');

      expect(first).not.toBe(second);
      expect(second.version).not.toEqual(first.version);
    });

    it('treats an org with no roles as version "empty"', async () => {
      const em = fakeEm([
        versionResult(null),
        permsResult([]),
        fieldRowsResult([]),
      ]);
      const entry = await getOrgRoleCacheEntry(em as never, 'org-empty');
      expect(entry.version).toBe('empty');
      expect(entry.permissionsByRole.size).toBe(0);
    });
  });
});
