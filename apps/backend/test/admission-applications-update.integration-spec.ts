/**
 * Regression test for the "loaded relation object wins over assigned FK id" bug
 * class (see src/database/apply-scalar-update.ts).
 *
 * AdmissionApplicationsService.update() must persist a changed `admissionSourceId`.
 * Before the fix, the update loaded the entity WITH its `admissionSource` relation,
 * so the assigned FK id was silently dropped on save and the DB kept the old value.
 *
 * This test reads back straight from the DB (a fresh findOne, NOT update()'s return
 * value) to prove the column actually changed — a mock-based unit test would not
 * catch this because the silent revert only happens inside TypeORM's save().
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=admission-applications-update
 *
 * Recommended follow-up integration tests (same bug class, not yet written):
 *   - addresses.service.update()   → countryId change persists
 *   - team-members.service.update() → teamId change persists
 */
import { DataSource, Repository } from 'typeorm';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { AdmissionApplicationsService } from '@/school-management/admissions/admission-applications.service';
import { AdmissionAuditLogsService } from '@/school-management/admissions/admission-audit-logs.service';
import { AdmissionApplication } from '@/school-management/admissions/entities/admission-application.entity';
import { AdmissionAuditLog } from '@/school-management/admissions/entities/admission-audit-log.entity';
import { AdmissionStage } from '@/school-management/admission-stages/entities/admission-stage.entity';
import { AdmissionStageType } from '@/school-management/admission-stages/enums/admission-stage-type.enum';
import { AdmissionSource } from '@/school-management/admission-sources/entities/admission-source.entity';
import { AdmissionRejectionReason } from '@/school-management/admission-rejection-reasons/entities/admission-rejection-reason.entity';
import { Family } from '@/school-management/families/entities/family.entity';
import { ContactPerson } from '@/school-management/contact-persons/entities/contact-person.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { createTestingApp, cleanDatabase } from './test-utils';

// Minimal module: wires only AdmissionApplicationsService + its deps directly,
// avoiding AdmissionsModule -> OrganizationSettingsModule -> better-auth (ESM,
// which ts-jest does not transform).
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdmissionApplication,
      AdmissionAuditLog,
      AdmissionStage,
      AdmissionRejectionReason,
      Family,
      ContactPerson,
    ]),
  ],
  providers: [AdmissionApplicationsService, AdmissionAuditLogsService],
})
class AdmissionUpdateTestModule {}

describe('AdmissionApplicationsService.update() FK persistence (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: AdmissionApplicationsService;

  let orgRepo: Repository<Organization>;
  let stageRepo: Repository<AdmissionStage>;
  let sourceRepo: Repository<AdmissionSource>;
  let appRepo: Repository<AdmissionApplication>;

  beforeAll(async () => {
    const app = await createTestingApp([AdmissionUpdateTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(AdmissionApplicationsService);

    orgRepo = dataSource.getRepository(Organization);
    stageRepo = dataSource.getRepository(AdmissionStage);
    sourceRepo = dataSource.getRepository(AdmissionSource);
    appRepo = dataSource.getRepository(AdmissionApplication);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  it('persists a changed admissionSourceId (loaded relation must not silently revert the FK)', async () => {
    // Arrange: org + default stage + two intake sources.
    const org = await orgRepo.save(orgRepo.create({}));

    const stage = await stageRepo.save(
      stageRepo.create({
        organizationId: org.id,
        name: 'Erstkontakt',
        slug: 'erstkontakt',
        stageType: AdmissionStageType.INITIAL,
        isDefault: true,
        position: 0,
      }),
    );

    const sourceA = await sourceRepo.save(
      sourceRepo.create({
        organizationId: org.id,
        name: 'Empfehlung',
        position: 0,
      }),
    );
    const sourceB = await sourceRepo.save(
      sourceRepo.create({
        organizationId: org.id,
        name: 'Webseite',
        position: 1,
      }),
    );

    // Application starts with source A.
    const created = await service.create(
      {
        childFirstName: 'Kind',
        childLastName: 'Muster',
        admissionStageId: stage.id,
        admissionSourceId: sourceA.id,
      },
      org.id,
    );
    expect(created.admissionSourceId).toBe(sourceA.id);

    // Act: switch to source B.
    await service.update(
      { id: created.id, admissionSourceId: sourceB.id },
      org.id,
    );

    // Assert: read straight from the DB, not update()'s return value.
    const fromDb = await appRepo.findOne({ where: { id: created.id } });
    expect(fromDb).toBeDefined();
    expect(fromDb!.admissionSourceId).toBe(sourceB.id);
  });

  it('does not update an application belonging to another organization (multi-tenant isolation)', async () => {
    const orgA = await orgRepo.save(orgRepo.create({}));
    const orgB = await orgRepo.save(orgRepo.create({}));

    const stageA = await stageRepo.save(
      stageRepo.create({
        organizationId: orgA.id,
        name: 'Erstkontakt',
        slug: 'erstkontakt',
        stageType: AdmissionStageType.INITIAL,
        isDefault: true,
        position: 0,
      }),
    );
    const sourceA = await sourceRepo.save(
      sourceRepo.create({
        organizationId: orgA.id,
        name: 'Empfehlung',
        position: 0,
      }),
    );

    const created = await service.create(
      {
        childFirstName: 'Kind',
        childLastName: 'Muster',
        admissionStageId: stageA.id,
        admissionSourceId: sourceA.id,
      },
      orgA.id,
    );

    // Update scoped to org B must not find the org-A application.
    await expect(
      service.update({ id: created.id, childFirstName: 'Hacked' }, orgB.id),
    ).rejects.toThrow();

    const fromDb = await appRepo.findOne({ where: { id: created.id } });
    expect(fromDb!.childFirstName).toBe('Kind');
  });
});
