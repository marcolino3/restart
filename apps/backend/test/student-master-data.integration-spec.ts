/**
 * Integration test for the student master-data extension (Scope 1).
 *
 * Covers what a mock-based unit test cannot: the real text[] array-column
 * writes on create/update (nationalities + languages), the new scalar fields,
 * and multi-tenant isolation on update.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=student-master-data
 */
import { DataSource, Repository } from 'typeorm';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { StudentsService } from '@/school-management/students/students.service';
import { Student } from '@/school-management/students/entities/student.entity';
import { AdmissionStage } from '@/school-management/admission-stages/entities/admission-stage.entity';
import { AdmissionStageType } from '@/school-management/admission-stages/enums/admission-stage-type.enum';
import { AdmissionStagesService } from '@/school-management/admission-stages/admission-stages.service';
import { Organization } from '@/organizations/entities/organization.entity';
import { createTestingApp, cleanDatabase } from './test-utils';

// Minimal module: wires only StudentsService + its direct deps, avoiding the
// full StudentsModule -> better-auth (ESM) chain.
@Module({
  imports: [TypeOrmModule.forFeature([Student, AdmissionStage])],
  providers: [StudentsService, AdmissionStagesService],
})
class StudentMasterDataTestModule {}

describe('StudentsService master-data (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: StudentsService;

  let orgRepo: Repository<Organization>;
  let stageRepo: Repository<AdmissionStage>;
  let studentRepo: Repository<Student>;

  beforeAll(async () => {
    const app = await createTestingApp([StudentMasterDataTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    service = module.get(StudentsService);

    orgRepo = dataSource.getRepository(Organization);
    stageRepo = dataSource.getRepository(AdmissionStage);
    studentRepo = dataSource.getRepository(Student);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  const seedOrgWithStage = async () => {
    const org = await orgRepo.save(orgRepo.create({}));
    await stageRepo.save(
      stageRepo.create({
        organizationId: org.id,
        name: 'Leads',
        slug: 'leads',
        stageType: AdmissionStageType.INITIAL,
        isDefault: true,
        position: 0,
      }),
    );
    return org;
  };

  it('persists scalar master-data fields on create', async () => {
    const org = await seedOrgWithStage();

    const created = await service.create(
      {
        firstName: 'Lea',
        lastName: 'Muster',
        preferredName: 'Lele',
        placeOfBirth: 'Zürich',
        firstLanguages: ['de', 'sq'],
        familyLanguages: ['sq'],
        religion: 'keine',
        socialSecurityNumber: '756.1234.5678.90',
        externalStudentId: 'EXT-42',
      },
      org.id,
    );

    const fromDb = await studentRepo.findOne({ where: { id: created.id } });
    expect(fromDb).toBeDefined();
    expect(fromDb!.preferredName).toBe('Lele');
    expect(fromDb!.placeOfBirth).toBe('Zürich');
    expect(fromDb!.firstLanguages).toEqual(['de', 'sq']);
    expect(fromDb!.familyLanguages).toEqual(['sq']);
    expect(fromDb!.religion).toBe('keine');
    expect(fromDb!.socialSecurityNumber).toBe('756.1234.5678.90');
    expect(fromDb!.externalStudentId).toBe('EXT-42');
  });

  it('writes the nationalities ISO-code array on create and reads it back', async () => {
    const org = await seedOrgWithStage();

    const created = await service.create(
      {
        firstName: 'Marco',
        lastName: 'Rossi',
        nationalities: ['CH', 'IT'],
      },
      org.id,
    );

    const fromDb = await studentRepo.findOne({ where: { id: created.id } });
    expect((fromDb!.nationalities ?? []).sort()).toEqual(['CH', 'IT']);
  });

  it('replaces the nationalities array on update (add + remove)', async () => {
    const org = await seedOrgWithStage();

    const created = await service.create(
      {
        firstName: 'Nina',
        lastName: 'Muster',
        nationalities: ['CH', 'IT'],
      },
      org.id,
    );

    // Update: CH stays, IT removed, DE added.
    await service.update(
      { id: created.id, nationalities: ['CH', 'DE'] },
      org.id,
    );

    const fromDb = await studentRepo.findOne({ where: { id: created.id } });
    expect((fromDb!.nationalities ?? []).sort()).toEqual(['CH', 'DE']);
  });

  it('leaves nationalities untouched when the field is omitted on update', async () => {
    const org = await seedOrgWithStage();

    const created = await service.create(
      {
        firstName: 'Tim',
        lastName: 'Muster',
        nationalities: ['CH'],
      },
      org.id,
    );

    // Update a scalar only — nationalities must remain.
    await service.update({ id: created.id, preferredName: 'Timmy' }, org.id);

    const fromDb = await studentRepo.findOne({ where: { id: created.id } });
    expect(fromDb!.nationalities ?? []).toEqual(['CH']);
    expect(fromDb!.preferredName).toBe('Timmy');
  });

  it('does not update a student of another organization (multi-tenant isolation)', async () => {
    const orgA = await seedOrgWithStage();
    const orgB = await seedOrgWithStage();

    const created = await service.create(
      { firstName: 'Kind', lastName: 'Muster' },
      orgA.id,
    );

    await expect(
      service.update({ id: created.id, preferredName: 'Hacked' }, orgB.id),
    ).rejects.toThrow();

    const fromDb = await studentRepo.findOne({ where: { id: created.id } });
    expect(fromDb!.preferredName).toBeNull();
  });
});
