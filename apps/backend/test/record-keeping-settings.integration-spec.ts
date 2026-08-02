/**
 * Integration test for RecordKeepingSettingsService (Fortschritte / progress
 * tracking settings).
 *
 * Covers what a mock-based unit test cannot: the real unique constraint on
 * organization_id and multi-tenant isolation against a real database.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=record-keeping-settings
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';

import {
  RECORD_KEEPING_SETTINGS_DEFAULTS,
  RecordKeepingSettingsService,
} from '@/curricula/record-keeping/record-keeping-settings.service';
import { RecordKeepingSettings } from '@/curricula/record-keeping/entities/record-keeping-settings.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { createTestingApp, cleanDatabase } from './test-utils';

@Module({
  imports: [TypeOrmModule.forFeature([RecordKeepingSettings])],
  providers: [RecordKeepingSettingsService],
})
class RecordKeepingSettingsTestModule {}

describe('RecordKeepingSettingsService (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: RecordKeepingSettingsService;
  let orgRepo: Repository<Organization>;
  let settingsRepo: Repository<RecordKeepingSettings>;

  beforeAll(async () => {
    const app = await createTestingApp([RecordKeepingSettingsTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(RecordKeepingSettingsService);

    orgRepo = dataSource.getRepository(Organization);
    settingsRepo = dataSource.getRepository(RecordKeepingSettings);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  const seedOrg = () => orgRepo.save(orgRepo.create({}));

  const input = {
    introducedStuckDays: 15,
    practicedStuckDays: 45,
    bigGapDays: 70,
  };

  describe('getForOrg', () => {
    it('returns synthesized defaults for an org with no stored row', async () => {
      const org = await seedOrg();

      const result = await service.getForOrg(org.id);

      expect(result.organizationId).toBe(org.id);
      expect(result).toMatchObject(RECORD_KEEPING_SETTINGS_DEFAULTS);
      // Nothing was persisted just by reading.
      expect(await settingsRepo.count()).toBe(0);
    });

    it('returns the stored row once the org has customized settings', async () => {
      const org = await seedOrg();
      await service.upsertForOrg(org.id, input);

      const result = await service.getForOrg(org.id);

      expect(result).toMatchObject({ organizationId: org.id, ...input });
    });

    it('never leaks another org’s settings (multi-tenant isolation)', async () => {
      const orgA = await seedOrg();
      const orgB = await seedOrg();
      await service.upsertForOrg(orgA.id, input);

      const result = await service.getForOrg(orgB.id);

      expect(result).toMatchObject({
        organizationId: orgB.id,
        ...RECORD_KEEPING_SETTINGS_DEFAULTS,
      });
    });
  });

  describe('upsertForOrg', () => {
    it('creates exactly one row scoped to the org', async () => {
      const org = await seedOrg();

      const created = await service.upsertForOrg(org.id, input);

      expect(created.organizationId).toBe(org.id);
      const rows = await settingsRepo.find();
      expect(rows).toHaveLength(1);
      expect(rows[0].organizationId).toBe(org.id);
    });

    it('updates the same row in place on a second call (unique org constraint)', async () => {
      const org = await seedOrg();
      const first = await service.upsertForOrg(org.id, input);

      const second = await service.upsertForOrg(org.id, {
        introducedStuckDays: 20,
        practicedStuckDays: 50,
        bigGapDays: 80,
      });

      expect(second.id).toBe(first.id);
      expect(await settingsRepo.count()).toBe(1);
      expect(second.introducedStuckDays).toBe(20);
    });

    it('does not modify another org’s settings row (multi-tenant isolation)', async () => {
      const orgA = await seedOrg();
      const orgB = await seedOrg();
      await service.upsertForOrg(orgA.id, input);

      await service.upsertForOrg(orgB.id, {
        introducedStuckDays: 99,
        practicedStuckDays: 99,
        bigGapDays: 99,
      });

      const orgAResult = await service.getForOrg(orgA.id);
      expect(orgAResult).toMatchObject(input);
      expect(await settingsRepo.count()).toBe(2);
    });

    it('lets two different orgs each hold their own row concurrently', async () => {
      const orgA = await seedOrg();
      const orgB = await seedOrg();

      await service.upsertForOrg(orgA.id, input);
      await service.upsertForOrg(orgB.id, {
        introducedStuckDays: 5,
        practicedStuckDays: 10,
        bigGapDays: 15,
      });

      const rows = await settingsRepo.find();
      expect(rows.map((r) => r.organizationId).sort()).toEqual(
        [orgA.id, orgB.id].sort(),
      );
    });
  });
});
