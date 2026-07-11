/**
 * Integration test for the student master-data extension (Scope 1).
 *
 * Covers what a mock-based unit test cannot: the real M:N `student_nationalities`
 * join-table writes on create/update (a TypeORM relation, not a scalar column),
 * the new scalar fields, and multi-tenant isolation on update.
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
import { Country } from '@/countries/entities/country.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { createTestingApp, cleanDatabase } from './test-utils';

// Minimal module: wires only StudentsService + its direct deps, avoiding the
// full StudentsModule -> better-auth (ESM) chain.
@Module({
  imports: [
    TypeOrmModule.forFeature([Student, AdmissionStage, Country]),
  ],
  providers: [StudentsService, AdmissionStagesService],
})
class StudentMasterDataTestModule {}

describe('StudentsService master-data (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let service: StudentsService;

  let orgRepo: Repository<Organization>;
  let stageRepo: Repository<AdmissionStage>;
  let countryRepo: Repository<Country>;
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
    countryRepo = dataSource.getRepository(Country);
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

  it('writes the nationalities M:N join on create and reads it back', async () => {
    const org = await seedOrgWithStage();
    const ch = await countryRepo.save(
      countryRepo.create({ name: 'Schweiz', isoCode: 'CH' }),
    );
    const it = await countryRepo.save(
      countryRepo.create({ name: 'Italien', isoCode: 'IT' }),
    );

    const created = await service.create(
      {
        firstName: 'Marco',
        lastName: 'Rossi',
        nationalityCountryIds: [ch.id, it.id],
      },
      org.id,
    );

    const withRel = await studentRepo.findOne({
      where: { id: created.id },
      relations: ['nationalities'],
    });
    const isoCodes = (withRel!.nationalities ?? [])
      .map((c) => c.isoCode)
      .sort();
    expect(isoCodes).toEqual(['CH', 'IT']);
  });

  it('replaces the nationalities join on update (add + remove)', async () => {
    const org = await seedOrgWithStage();
    const ch = await countryRepo.save(
      countryRepo.create({ name: 'Schweiz', isoCode: 'CH' }),
    );
    const it = await countryRepo.save(
      countryRepo.create({ name: 'Italien', isoCode: 'IT' }),
    );
    const de = await countryRepo.save(
      countryRepo.create({ name: 'Deutschland', isoCode: 'DE' }),
    );

    const created = await service.create(
      {
        firstName: 'Nina',
        lastName: 'Muster',
        nationalityCountryIds: [ch.id, it.id],
      },
      org.id,
    );

    // Update: CH stays, IT removed, DE added.
    await service.update(
      { id: created.id, nationalityCountryIds: [ch.id, de.id] },
      org.id,
    );

    const withRel = await studentRepo.findOne({
      where: { id: created.id },
      relations: ['nationalities'],
    });
    const isoCodes = (withRel!.nationalities ?? [])
      .map((c) => c.isoCode)
      .sort();
    expect(isoCodes).toEqual(['CH', 'DE']);
  });

  it('leaves nationalities untouched when the field is omitted on update', async () => {
    const org = await seedOrgWithStage();
    const ch = await countryRepo.save(
      countryRepo.create({ name: 'Schweiz', isoCode: 'CH' }),
    );

    const created = await service.create(
      {
        firstName: 'Tim',
        lastName: 'Muster',
        nationalityCountryIds: [ch.id],
      },
      org.id,
    );

    // Update a scalar only — nationalities must remain.
    await service.update({ id: created.id, preferredName: 'Timmy' }, org.id);

    const withRel = await studentRepo.findOne({
      where: { id: created.id },
      relations: ['nationalities'],
    });
    expect((withRel!.nationalities ?? []).map((c) => c.isoCode)).toEqual(['CH']);
    expect(withRel!.preferredName).toBe('Timmy');
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
