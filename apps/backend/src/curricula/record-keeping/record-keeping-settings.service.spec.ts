import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { RecordKeepingSettings } from './entities/record-keeping-settings.entity';
import {
  RECORD_KEEPING_SETTINGS_DEFAULTS,
  RecordKeepingSettingsService,
} from './record-keeping-settings.service';

describe('RecordKeepingSettingsService', () => {
  let service: RecordKeepingSettingsService;
  let repo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 'set-1', ...x })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordKeepingSettingsService,
        { provide: getRepositoryToken(RecordKeepingSettings), useValue: repo },
      ],
    }).compile();

    service = module.get(RecordKeepingSettingsService);
  });

  describe('getForOrg', () => {
    it('scopes the lookup to the org', async () => {
      repo.findOne.mockResolvedValue(null);
      await service.getForOrg('org-1');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
      });
    });

    it('returns the existing row when the org has customized settings', async () => {
      const existing = {
        id: 'set-1',
        organizationId: 'org-1',
        introducedStuckDays: 10,
        practicedStuckDays: 20,
        bigGapDays: 30,
      };
      repo.findOne.mockResolvedValue(existing);

      const result = await service.getForOrg('org-1');

      expect(result).toBe(existing);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('synthesizes defaults scoped to the org when nothing is stored', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.getForOrg('org-1');

      expect(repo.create).toHaveBeenCalledWith({
        organizationId: 'org-1',
        ...RECORD_KEEPING_SETTINGS_DEFAULTS,
      });
      expect(result).toEqual({
        organizationId: 'org-1',
        ...RECORD_KEEPING_SETTINGS_DEFAULTS,
      });
    });

    it('never returns another org row for a different caller (multi-tenant isolation)', async () => {
      // Simulate the repo mock ignoring the where clause misbehaving would look like:
      // the service must always pass the caller's org into findOne, never a cached/other value.
      repo.findOne.mockResolvedValue(null);

      await service.getForOrg('org-2');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { organizationId: 'org-2' },
      });
      expect(repo.findOne).not.toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
      });
    });
  });

  describe('upsertForOrg', () => {
    const input = {
      introducedStuckDays: 15,
      practicedStuckDays: 45,
      bigGapDays: 70,
    };

    it('updates the existing row in place for the caller org', async () => {
      const existing = {
        id: 'set-1',
        organizationId: 'org-1',
        introducedStuckDays: 30,
        practicedStuckDays: 90,
        bigGapDays: 60,
      };
      repo.findOne.mockResolvedValue(existing);

      const result = await service.upsertForOrg('org-1', input);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
      });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'set-1',
          organizationId: 'org-1',
          ...input,
        }),
      );
      expect(result).toEqual(expect.objectContaining(input));
    });

    it('creates a new row scoped to the org when none exists yet', async () => {
      repo.findOne.mockResolvedValue(null);

      await service.upsertForOrg('org-1', input);

      expect(repo.create).toHaveBeenCalledWith({
        organizationId: 'org-1',
        ...input,
      });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1', ...input }),
      );
    });

    it('cannot update another org row when called for a different org (multi-tenant isolation)', async () => {
      const orgOneRow = {
        id: 'set-1',
        organizationId: 'org-1',
        introducedStuckDays: 30,
        practicedStuckDays: 90,
        bigGapDays: 60,
      };
      // repo.findOne is scoped by the where clause the service builds; a caller
      // from org-2 must never receive/mutate org-1's row.
      repo.findOne.mockImplementation(({ where }) =>
        where.organizationId === 'org-1' ? orgOneRow : null,
      );

      await service.upsertForOrg('org-2', input);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { organizationId: 'org-2' },
      });
      expect(repo.create).toHaveBeenCalledWith({
        organizationId: 'org-2',
        ...input,
      });
      expect(repo.save).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: 'set-1' }),
      );
    });
  });
});
