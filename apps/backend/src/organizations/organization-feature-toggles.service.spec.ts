import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OrganizationFeatureTogglesService } from './organization-feature-toggles.service';
import { OrganizationFeatureToggle } from '@/organizations/entities/organization-feature-toggle.entity';
import { OrgFeatureKey } from '@restart/shared-schemas/org-features/feature-catalog';

describe('OrganizationFeatureTogglesService', () => {
  let service: OrganizationFeatureTogglesService;
  let repo: jest.Mocked<Repository<OrganizationFeatureToggle>>;

  const orgId = 'org-1';
  const changedById = 'user-1';

  const makeToggle = (
    featureKey: OrgFeatureKey,
    enabled: boolean,
  ): OrganizationFeatureToggle =>
    ({
      organizationId: orgId,
      featureKey,
      enabled,
    }) as OrganizationFeatureToggle;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationFeatureTogglesService,
        {
          provide: getRepositoryToken(OrganizationFeatureToggle),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn((data) => data),
            save: jest.fn((data) => Promise.resolve(data)),
          },
        },
      ],
    }).compile();

    service = module.get(OrganizationFeatureTogglesService);
    repo = module.get(getRepositoryToken(OrganizationFeatureToggle));
  });

  describe('findAllForOrg', () => {
    it('fills in missing rows using each key catalog defaultEnabled value', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAllForOrg(orgId);

      const learningReports = result.find(
        (t) => t.featureKey === (OrgFeatureKey.LEARNING_REPORTS as string),
      );
      const timeTracking = result.find(
        (t) => t.featureKey === (OrgFeatureKey.TIME_TRACKING as string),
      );
      expect(learningReports?.enabled).toBe(false);
      expect(timeTracking?.enabled).toBe(true);
    });

    it('keeps existing rows as-is', async () => {
      repo.find.mockResolvedValue([
        makeToggle(OrgFeatureKey.TIME_TRACKING, false),
      ]);

      const result = await service.findAllForOrg(orgId);
      const timeTracking = result.find(
        (t) => t.featureKey === (OrgFeatureKey.TIME_TRACKING as string),
      );
      expect(timeTracking?.enabled).toBe(false);
    });
  });

  describe('setEnabled', () => {
    it('updates only the target key when enabling', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.setEnabled(
        orgId,
        OrgFeatureKey.TIME_TRACKING,
        true,
        changedById,
      );

      expect(result).toHaveLength(1);
      expect(result[0].featureKey).toBe(OrgFeatureKey.TIME_TRACKING);
      expect(result[0].enabled).toBe(true);
    });

    it('cascades disabling a parent to its dependent features', async () => {
      repo.find.mockResolvedValue([
        makeToggle(OrgFeatureKey.TIME_TRACKING, true),
        makeToggle(OrgFeatureKey.TIME_REPORTS, true),
      ]);

      const result = await service.setEnabled(
        orgId,
        OrgFeatureKey.TIME_TRACKING,
        false,
        changedById,
      );

      const byKey = new Map(result.map((t) => [t.featureKey, t]));
      expect(byKey.get(OrgFeatureKey.TIME_TRACKING)?.enabled).toBe(false);
      expect(byKey.get(OrgFeatureKey.TIME_REPORTS)?.enabled).toBe(false);
      expect(result.every((t) => t.changedById === changedById)).toBe(true);
    });

    it('does not cascade when enabling a parent', async () => {
      repo.find.mockResolvedValue([
        makeToggle(OrgFeatureKey.TIME_TRACKING, false),
        makeToggle(OrgFeatureKey.TIME_REPORTS, false),
      ]);

      const result = await service.setEnabled(
        orgId,
        OrgFeatureKey.TIME_TRACKING,
        true,
        changedById,
      );

      expect(result).toHaveLength(1);
      expect(result[0].featureKey).toBe(OrgFeatureKey.TIME_TRACKING);
    });

    it('leaves unrelated features untouched when cascading', async () => {
      repo.find.mockResolvedValue([
        makeToggle(OrgFeatureKey.PROGRESS, true),
        makeToggle(OrgFeatureKey.LEARNING_REPORTS, true),
        makeToggle(OrgFeatureKey.CHATS, true),
      ]);

      const result = await service.setEnabled(
        orgId,
        OrgFeatureKey.PROGRESS,
        false,
        changedById,
      );

      const keys = result.map((t) => t.featureKey);
      expect(keys).toContain(OrgFeatureKey.PROGRESS);
      expect(keys).toContain(OrgFeatureKey.LEARNING_REPORTS);
      expect(keys).not.toContain(OrgFeatureKey.CHATS);
    });
  });

  describe('bulkSetEnabled', () => {
    it('applies multiple independent updates in one call', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.bulkSetEnabled(
        orgId,
        [
          { featureKey: OrgFeatureKey.TIME_TRACKING, enabled: true },
          { featureKey: OrgFeatureKey.CHATS, enabled: true },
        ],
        changedById,
      );

      const keys = result.map((t) => t.featureKey);
      expect(keys).toEqual(
        expect.arrayContaining([
          OrgFeatureKey.TIME_TRACKING,
          OrgFeatureKey.CHATS,
        ]),
      );
      expect(result.every((t) => t.changedById === changedById)).toBe(true);
    });

    it('cascades dependency disabling across multiple keys in the same bulk call', async () => {
      repo.find
        .mockResolvedValueOnce([
          makeToggle(OrgFeatureKey.TIME_TRACKING, true),
          makeToggle(OrgFeatureKey.TIME_REPORTS, true),
        ])
        .mockResolvedValueOnce([
          makeToggle(OrgFeatureKey.PROGRESS, true),
          makeToggle(OrgFeatureKey.LEARNING_REPORTS, true),
        ]);

      const result = await service.bulkSetEnabled(
        orgId,
        [
          { featureKey: OrgFeatureKey.TIME_TRACKING, enabled: false },
          { featureKey: OrgFeatureKey.PROGRESS, enabled: false },
        ],
        changedById,
      );

      const byKey = new Map(result.map((t) => [t.featureKey, t]));
      expect(byKey.get(OrgFeatureKey.TIME_TRACKING)?.enabled).toBe(false);
      expect(byKey.get(OrgFeatureKey.TIME_REPORTS)?.enabled).toBe(false);
      expect(byKey.get(OrgFeatureKey.PROGRESS)?.enabled).toBe(false);
      expect(byKey.get(OrgFeatureKey.LEARNING_REPORTS)?.enabled).toBe(false);
    });

    it('dedupes results by featureKey, keeping the last update for a repeated key', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.bulkSetEnabled(
        orgId,
        [
          { featureKey: OrgFeatureKey.CHATS, enabled: true },
          { featureKey: OrgFeatureKey.CHATS, enabled: false },
        ],
        changedById,
      );

      const chatsEntries = result.filter(
        (t) => t.featureKey === (OrgFeatureKey.CHATS as string),
      );
      expect(chatsEntries).toHaveLength(1);
      expect(chatsEntries[0].enabled).toBe(false);
    });
  });
});
