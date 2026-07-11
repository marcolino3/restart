/**
 * Integration test for the student support-record feature (Scope 2).
 *
 * Covers what a mock-based unit test cannot: real FK behaviour
 * (category SET NULL on delete, entry CASCADE), org-scoping and multi-tenant
 * isolation across the category + entry services.
 *
 * Requires the PostgreSQL test DB:
 *   docker compose -f docker-compose.test.yml up -d
 * Run with:
 *   npx jest --config ./test/jest-e2e.json --testPathPatterns=student-records
 */
import { DataSource, Repository } from 'typeorm';
import { Module } from '@nestjs/common';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestingModule } from '@nestjs/testing';

import { StudentRecordCategoriesService } from '@/school-management/student-records/student-record-categories.service';
import { StudentRecordEntriesService } from '@/school-management/student-records/student-record-entries.service';
import { StudentRecordCategory } from '@/school-management/student-records/entities/student-record-category.entity';
import { StudentRecordEntry } from '@/school-management/student-records/entities/student-record-entry.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { createTestingApp, cleanDatabase } from './test-utils';

// Minimal module: wires the two services + their entity repos, avoiding the
// full StudentRecordsModule -> better-auth (ESM) chain.
@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentRecordCategory,
      StudentRecordEntry,
      Student,
    ]),
  ],
  providers: [StudentRecordCategoriesService, StudentRecordEntriesService],
})
class StudentRecordsTestModule {}

describe('StudentRecords services (Integration)', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let categories: StudentRecordCategoriesService;
  let entries: StudentRecordEntriesService;

  let orgRepo: Repository<Organization>;
  let studentRepo: Repository<Student>;
  let categoryRepo: Repository<StudentRecordCategory>;
  let entryRepo: Repository<StudentRecordEntry>;

  beforeAll(async () => {
    const app = await createTestingApp([StudentRecordsTestModule], {
      loadAllEntities: true,
    });
    module = app.module;
    dataSource = app.dataSource;
    categories = module.get(StudentRecordCategoriesService);
    entries = module.get(StudentRecordEntriesService);

    orgRepo = dataSource.getRepository(Organization);
    studentRepo = dataSource.getRepository(Student);
    categoryRepo = dataSource.getRepository(StudentRecordCategory);
    entryRepo = dataSource.getRepository(StudentRecordEntry);
  }, 30000);

  afterAll(async () => {
    await dataSource?.destroy();
    await module?.close();
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  const seedOrg = () => orgRepo.save(orgRepo.create({}));

  const seedStudent = (organizationId: string, firstName = 'Kind') =>
    studentRepo.save(
      studentRepo.create({ firstName, lastName: 'Muster', organizationId }),
    );

  // --- Categories ---

  it('creates a category and auto-assigns an incrementing position', async () => {
    const org = await seedOrg();
    const a = await categories.create({ name: 'Logopädie' }, org.id);
    const b = await categories.create({ name: 'DaZ' }, org.id);
    expect(a.position).toBe(0);
    expect(b.position).toBe(1);
    expect(a.isArchived).toBe(false);
  });

  it('lists only the org’s categories (multi-tenant isolation)', async () => {
    const orgA = await seedOrg();
    const orgB = await seedOrg();
    await categories.create({ name: 'IF' }, orgA.id);
    await categories.create({ name: 'Psychomotorik' }, orgB.id);

    const listA = await categories.findAllByOrgId(orgA.id);
    expect(listA.map((c) => c.name)).toEqual(['IF']);
  });

  it('does not find a foreign org’s category', async () => {
    const orgA = await seedOrg();
    const orgB = await seedOrg();
    const cat = await categories.create({ name: 'IF' }, orgA.id);
    await expect(categories.findOne(cat.id, orgB.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('excludes archived categories unless includeArchived', async () => {
    const org = await seedOrg();
    const cat = await categories.create({ name: 'IF' }, org.id);
    await categories.archive(cat.id, org.id);
    expect(await categories.findAllByOrgId(org.id)).toHaveLength(0);
    expect(await categories.findAllByOrgId(org.id, true)).toHaveLength(1);
  });

  // --- Entries ---

  it('creates an entry with author + category and reads it back', async () => {
    const org = await seedOrg();
    const student = await seedStudent(org.id);
    const cat = await categories.create({ name: 'Logopädie' }, org.id);

    const created = await entries.create(
      {
        studentId: student.id,
        categoryId: cat.id,
        title: 'Erstgespräch',
        content: 'Abklärung gestartet',
        occurredAt: '2026-07-11T09:00:00.000Z',
      },
      org.id,
      null,
    );

    expect(created.title).toBe('Erstgespräch');
    expect(created.categoryId).toBe(cat.id);
    expect(created.isConfidential).toBe(true); // default
    expect(created.category?.name).toBe('Logopädie');
  });

  it('rejects an entry for a student of another org', async () => {
    const orgA = await seedOrg();
    const orgB = await seedOrg();
    const studentA = await seedStudent(orgA.id);

    await expect(
      entries.create(
        { studentId: studentA.id, occurredAt: '2026-07-11T09:00:00.000Z' },
        orgB.id,
        null,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects an entry referencing a foreign org’s category', async () => {
    const orgA = await seedOrg();
    const orgB = await seedOrg();
    const studentB = await seedStudent(orgB.id);
    const catA = await categories.create({ name: 'IF' }, orgA.id);

    await expect(
      entries.create(
        {
          studentId: studentB.id,
          categoryId: catA.id,
          occurredAt: '2026-07-11T09:00:00.000Z',
        },
        orgB.id,
        null,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('sets entry.categoryId to NULL when the category is deleted (SET NULL FK)', async () => {
    const org = await seedOrg();
    const student = await seedStudent(org.id);
    const cat = await categories.create({ name: 'Logopädie' }, org.id);
    const entry = await entries.create(
      {
        studentId: student.id,
        categoryId: cat.id,
        occurredAt: '2026-07-11T09:00:00.000Z',
      },
      org.id,
      null,
    );

    // Hard-delete the category row → FK SET NULL must clear the entry's ref.
    await categoryRepo.delete({ id: cat.id });

    const reloaded = await entryRepo.findOne({ where: { id: entry.id } });
    expect(reloaded).not.toBeNull();
    expect(reloaded!.categoryId).toBeNull();
  });

  it('does not update an entry of another organization (multi-tenant isolation)', async () => {
    const orgA = await seedOrg();
    const orgB = await seedOrg();
    const student = await seedStudent(orgA.id);
    const entry = await entries.create(
      { studentId: student.id, occurredAt: '2026-07-11T09:00:00.000Z' },
      orgA.id,
      null,
    );

    await expect(
      entries.update({ id: entry.id, title: 'Hacked' }, orgB.id),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists entries newest-first and only for the given student', async () => {
    const org = await seedOrg();
    const s1 = await seedStudent(org.id, 'Anna');
    const s2 = await seedStudent(org.id, 'Beat');
    await entries.create(
      { studentId: s1.id, occurredAt: '2026-07-10T09:00:00.000Z' },
      org.id,
      null,
    );
    await entries.create(
      { studentId: s1.id, occurredAt: '2026-07-11T09:00:00.000Z' },
      org.id,
      null,
    );
    await entries.create(
      { studentId: s2.id, occurredAt: '2026-07-11T09:00:00.000Z' },
      org.id,
      null,
    );

    const list = await entries.findByStudent(s1.id, org.id);
    expect(list).toHaveLength(2);
    // occurredAt DESC → 07-11 before 07-10
    expect(list[0].occurredAt.getTime()).toBeGreaterThan(
      list[1].occurredAt.getTime(),
    );
  });
});
