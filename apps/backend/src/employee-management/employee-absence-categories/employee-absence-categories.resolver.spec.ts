import { Test, TestingModule } from '@nestjs/testing';

import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';
import {
  guardsOf,
  methodOf,
  overrideAllAuthGuards,
  TEST_ORG_ID,
} from '@/common/testing/auth-test.util';

import { EmployeeAbsenceCategoriesResolver } from './employee-absence-categories.resolver';
import { EmployeeAbsenceCategoriesService } from './employee-absence-categories.service';

/** Reads the `@Permissions()` metadata a resolver method carries, if any. */
function permsOf(name: keyof EmployeeAbsenceCategoriesResolver): string[] {
  return (
    (Reflect.getMetadata(
      PERMS_KEY,
      methodOf(EmployeeAbsenceCategoriesResolver, name),
    ) as string[] | undefined) ?? []
  );
}

describe('EmployeeAbsenceCategoriesResolver', () => {
  let resolver: EmployeeAbsenceCategoriesResolver;
  let service: {
    seedOrgEmployeeAbsenceCategories: jest.Mock;
    resyncSystemTranslations: jest.Mock;
    findEmployeeAbsenceCategoriesByOrgId: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    archive: jest.Mock;
    reorder: jest.Mock;
    setActive: jest.Mock;
    upsertTranslation: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      seedOrgEmployeeAbsenceCategories: jest.fn().mockResolvedValue(undefined),
      resyncSystemTranslations: jest.fn().mockResolvedValue(undefined),
      findEmployeeAbsenceCategoriesByOrgId: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ id: 'cat-1' }),
      create: jest.fn().mockResolvedValue({ id: 'cat-1' }),
      update: jest.fn().mockResolvedValue({ id: 'cat-1' }),
      archive: jest.fn().mockResolvedValue(true),
      reorder: jest.fn().mockResolvedValue([]),
      setActive: jest.fn().mockResolvedValue({ id: 'cat-1' }),
      upsertTranslation: jest.fn().mockResolvedValue({ id: 'tr-1' }),
    };

    const module: TestingModule = await overrideAllAuthGuards(
      Test.createTestingModule({
        providers: [
          EmployeeAbsenceCategoriesResolver,
          { provide: EmployeeAbsenceCategoriesService, useValue: service },
        ],
      }),
    ).compile();

    resolver = module.get<EmployeeAbsenceCategoriesResolver>(
      EmployeeAbsenceCategoriesResolver,
    );
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('guard & permission wiring', () => {
    it('gates the whole resolver behind auth + access guards', () => {
      const classGuards = guardsOf(EmployeeAbsenceCategoriesResolver);
      expect(classGuards).toEqual(
        expect.arrayContaining([GqlBetterAuthGuard, GraphQLAccessGuard]),
      );
    });

    it('restricts system seed/resync mutations to super admins', () => {
      expect(
        guardsOf(
          methodOf(
            EmployeeAbsenceCategoriesResolver,
            'seedSystemEmployeeAbsenceCategories',
          ),
        ),
      ).toEqual(expect.arrayContaining([SuperAdminGuard]));
      expect(
        guardsOf(
          methodOf(
            EmployeeAbsenceCategoriesResolver,
            'resyncSystemEmployeeAbsenceCategoryTranslations',
          ),
        ),
      ).toEqual(expect.arrayContaining([SuperAdminGuard]));
    });

    it('requires READ permission on the read operations', () => {
      expect(permsOf('findEmployeeAbsenceCategoriesByOrgId')).toContain(
        'EMPLOYEE_ABSENCE_CATEGORY_READ',
      );
      expect(permsOf('findOne')).toContain('EMPLOYEE_ABSENCE_CATEGORY_READ');
    });

    it('requires MANAGE permission on every mutating operation', () => {
      const managed: (keyof EmployeeAbsenceCategoriesResolver)[] = [
        'createEmployeeAbsenceCategory',
        'updateEmployeeAbsenceCategory',
        'archiveEmployeeAbsenceCategory',
        'reorderEmployeeAbsenceCategories',
        'setEmployeeAbsenceCategoryActive',
        'upsertEmployeeAbsenceCategoryTranslation',
      ];
      for (const name of managed) {
        expect(permsOf(name)).toContain('EMPLOYEE_ABSENCE_CATEGORY_MANAGE');
      }
    });
  });

  describe('org-scoped delegation', () => {
    it('forwards the current org id to the read queries', async () => {
      await resolver.findEmployeeAbsenceCategoriesByOrgId(TEST_ORG_ID);
      expect(service.findEmployeeAbsenceCategoriesByOrgId).toHaveBeenCalledWith(
        TEST_ORG_ID,
      );

      await resolver.findOne('cat-1', TEST_ORG_ID);
      expect(service.findOne).toHaveBeenCalledWith('cat-1', TEST_ORG_ID);
    });

    it('forwards input + current org id to create/update', async () => {
      const createInput = { key: 'sick' } as never;
      await resolver.createEmployeeAbsenceCategory(createInput, TEST_ORG_ID);
      expect(service.create).toHaveBeenCalledWith(createInput, TEST_ORG_ID);

      const updateInput = { id: 'cat-1' } as never;
      await resolver.updateEmployeeAbsenceCategory(updateInput, TEST_ORG_ID);
      expect(service.update).toHaveBeenCalledWith(updateInput, TEST_ORG_ID);
    });

    it('forwards the current org id to archive/reorder/setActive', async () => {
      await resolver.archiveEmployeeAbsenceCategory('cat-1', TEST_ORG_ID);
      expect(service.archive).toHaveBeenCalledWith('cat-1', TEST_ORG_ID);

      await resolver.reorderEmployeeAbsenceCategories(['a', 'b'], TEST_ORG_ID);
      expect(service.reorder).toHaveBeenCalledWith(['a', 'b'], TEST_ORG_ID);

      await resolver.setEmployeeAbsenceCategoryActive(
        'cat-1',
        false,
        TEST_ORG_ID,
      );
      expect(service.setActive).toHaveBeenCalledWith(
        'cat-1',
        TEST_ORG_ID,
        false,
      );
    });

    it('forwards translation upserts with the current org id', async () => {
      const input = { categoryId: 'cat-1', locale: 'de' } as never;
      await resolver.upsertEmployeeAbsenceCategoryTranslation(
        input,
        TEST_ORG_ID,
      );
      expect(service.upsertTranslation).toHaveBeenCalledWith(
        input,
        TEST_ORG_ID,
      );
    });

    it('passes the explicit org id argument through the super-admin seed/resync', async () => {
      await resolver.seedSystemEmployeeAbsenceCategories(TEST_ORG_ID);
      expect(service.seedOrgEmployeeAbsenceCategories).toHaveBeenCalledWith(
        TEST_ORG_ID,
      );

      await resolver.resyncSystemEmployeeAbsenceCategoryTranslations(
        TEST_ORG_ID,
      );
      expect(service.resyncSystemTranslations).toHaveBeenCalledWith(
        TEST_ORG_ID,
      );
    });
  });
});
