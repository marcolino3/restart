import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Address } from '@/addresses/entities/address.entity';
import { Country } from '@/countries/entities/country.entity';
import { GradeLevel } from '../../grade-levels/entities/grade-level.entity';
import { SchoolClass } from '../../school-classes/entities/school-class.entity';
import { SchoolClassEnrollment } from '../../school-class-enrollments/entities/school-class-enrollment.entity';
import { ContactPerson } from '../../contact-persons/entities/contact-person.entity';
import { StudentContactPerson } from '../../contact-persons/entities/student-contact-person.entity';
import { Family } from '../../families/entities/family.entity';
import { Student } from '../entities/student.entity';
import {
  ImportStudentsInput,
  StudentImportContactInput,
  StudentImportStudentInput,
} from './dto/import-students.input';
import {
  StudentImportMode,
  StudentImportPlanType,
  StudentImportResultType,
} from './dto/student-import-plan.types';
import { parseStudentImportFile } from './student-file-parser';
import {
  buildStudentImportPlan,
  type ExistingData,
} from './student-plan-builder';

@Injectable()
export class StudentsImportService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(ContactPerson)
    private readonly contactRepo: Repository<ContactPerson>,
    @InjectRepository(SchoolClass)
    private readonly schoolClassRepo: Repository<SchoolClass>,
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepo: Repository<GradeLevel>,
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    private readonly dataSource: DataSource,
  ) {}

  async previewFromBuffer(
    buffer: Buffer,
    filename: string,
    organizationId: string,
  ): Promise<StudentImportPlanType> {
    const parsed = parseStudentImportFile(buffer, filename);
    const existing = await this.loadExistingData(organizationId);
    return buildStudentImportPlan(parsed, existing);
  }

  private async loadExistingData(
    organizationId: string,
  ): Promise<ExistingData> {
    const [students, contacts, schoolClasses, gradeLevels, countries] =
      await Promise.all([
        this.studentRepo.find({
          where: { organizationId, isArchived: false },
          select: [
            'id',
            'firstName',
            'lastName',
            'dateOfBirth',
            'externalStudentId',
          ],
        }),
        this.contactRepo.find({
          where: { organizationId, isArchived: false },
          select: [
            'id',
            'firstName',
            'lastName',
            'email',
            'phone',
            'mobile',
            'familyId',
          ],
        }),
        this.schoolClassRepo.find({
          where: { organizationId, isArchived: false },
          select: ['id', 'name'],
        }),
        this.gradeLevelRepo.find({
          where: { organizationId, isArchived: false },
          select: ['id', 'name'],
        }),
        // Countries are global reference data, not org-scoped.
        this.countryRepo.find({ select: ['id', 'name', 'isoCode'] }),
      ]);
    return { students, contacts, schoolClasses, gradeLevels, countries };
  }

  async applyPlan(
    input: ImportStudentsInput,
    organizationId: string,
  ): Promise<StudentImportResultType> {
    this.assertUniqueKeys(input);
    await this.assertReferencesInOrg(input, organizationId);

    const result: StudentImportResultType = {
      createdStudents: 0,
      updatedStudents: 0,
      skippedStudents: 0,
      createdContacts: 0,
      updatedContacts: 0,
      createdFamilies: 0,
      createdLinks: 0,
      createdEnrollments: 0,
    };

    await this.dataSource.transaction(async (m) => {
      const familyIdByKey = await this.upsertFamilies(
        m,
        input,
        organizationId,
        result,
      );
      const contactIdByTempId = await this.upsertContacts(
        m,
        input,
        familyIdByKey,
        organizationId,
        result,
      );
      await this.upsertStudents(
        m,
        input,
        contactIdByTempId,
        organizationId,
        result,
      );
    });

    return result;
  }

  /** Temp ids and family keys must be unique and resolvable within one plan. */
  private assertUniqueKeys(input: ImportStudentsInput): void {
    const familyKeys = new Set<string>();
    for (const family of input.families) {
      if (familyKeys.has(family.key)) {
        throw new BadRequestException(`Duplicate family key "${family.key}"`);
      }
      familyKeys.add(family.key);
    }
    const contactIds = new Set<string>();
    for (const contact of input.contacts) {
      if (contactIds.has(contact.tempId)) {
        throw new BadRequestException(
          `Duplicate contact tempId "${contact.tempId}"`,
        );
      }
      contactIds.add(contact.tempId);
      if (!familyKeys.has(contact.familyKey)) {
        throw new BadRequestException(
          `Contact "${contact.tempId}" references unknown family "${contact.familyKey}"`,
        );
      }
    }
    const studentIds = new Set<string>();
    for (const student of input.students) {
      if (studentIds.has(student.tempId)) {
        throw new BadRequestException(
          `Duplicate student tempId "${student.tempId}"`,
        );
      }
      studentIds.add(student.tempId);
      if (!familyKeys.has(student.familyKey)) {
        throw new BadRequestException(
          `Student "${student.tempId}" references unknown family "${student.familyKey}"`,
        );
      }
      for (const link of student.links ?? []) {
        if (!contactIds.has(link.contactTempId)) {
          throw new BadRequestException(
            `Student "${student.tempId}" links unknown contact "${link.contactTempId}"`,
          );
        }
      }
    }
  }

  /**
   * Multi-tenant guard: every id the client sends back must belong to the
   * active organization, otherwise the import could attach foreign records.
   */
  private async assertReferencesInOrg(
    input: ImportStudentsInput,
    organizationId: string,
  ): Promise<void> {
    const check = async <T extends { id: string }>(
      repo: Repository<T>,
      ids: string[],
      label: string,
    ): Promise<void> => {
      const unique = [...new Set(ids)];
      if (unique.length === 0) return;
      const found = await repo.find({
        where: { id: In(unique), organizationId } as never,
        select: ['id'] as never,
      });
      if (found.length !== unique.length) {
        throw new BadRequestException(
          `One or more ${label} do not belong to the active organization`,
        );
      }
    };

    await Promise.all([
      check(
        this.studentRepo,
        input.students
          .map((s) => s.existingStudentId)
          .filter((id): id is string => !!id),
        'students',
      ),
      check(
        this.contactRepo,
        input.contacts
          .map((c) => c.existingContactPersonId)
          .filter((id): id is string => !!id),
        'contact persons',
      ),
      check(
        this.schoolClassRepo,
        input.students
          .map((s) => s.schoolClassId)
          .filter((id): id is string => !!id),
        'school classes',
      ),
      check(
        this.gradeLevelRepo,
        input.students
          .map((s) => s.gradeLevelId)
          .filter((id): id is string => !!id),
        'grade levels',
      ),
      check(
        this.dataSource.getRepository(Family),
        input.families
          .map((f) => f.existingFamilyId)
          .filter((id): id is string => !!id),
        'families',
      ),
    ]);
  }

  private async upsertFamilies(
    m: EntityManager,
    input: ImportStudentsInput,
    organizationId: string,
    result: StudentImportResultType,
  ): Promise<Map<string, string>> {
    const byKey = new Map<string, string>();
    for (const family of input.families) {
      let addressId: string | null = null;
      if (family.address && hasAddressValue(family.address)) {
        const address = await m.save(
          m.create(Address, { ...family.address, organizationId }),
        );
        addressId = address.id;
      }

      if (family.existingFamilyId) {
        const entity = await m.findOne(Family, {
          where: { id: family.existingFamilyId, organizationId },
        });
        if (entity) {
          // Never drop an address the school already maintains.
          if (addressId && !entity.primaryAddressId) {
            entity.primaryAddressId = addressId;
            await m.save(entity);
          }
          byKey.set(family.key, entity.id);
          continue;
        }
      }

      const created = await m.save(
        m.create(Family, {
          name: family.name,
          primaryAddressId: addressId,
          organizationId,
        }),
      );
      result.createdFamilies += 1;
      byKey.set(family.key, created.id);
    }
    return byKey;
  }

  private async upsertContacts(
    m: EntityManager,
    input: ImportStudentsInput,
    familyIdByKey: Map<string, string>,
    organizationId: string,
    result: StudentImportResultType,
  ): Promise<Map<string, string>> {
    const byTempId = new Map<string, string>();
    const updateExisting = input.mode === StudentImportMode.UPDATE_EXISTING;

    for (const contact of input.contacts) {
      const familyId = familyIdByKey.get(contact.familyKey)!;
      const familyAddressId = await this.familyAddressId(m, familyId);

      if (contact.existingContactPersonId) {
        const entity = await m.findOne(ContactPerson, {
          where: { id: contact.existingContactPersonId, organizationId },
        });
        if (entity) {
          if (updateExisting) {
            applyFilledContactFields(entity, contact);
            entity.familyId ??= familyId;
            entity.addressId ??= familyAddressId;
            await m.save(entity);
            result.updatedContacts += 1;
          }
          byTempId.set(contact.tempId, entity.id);
          continue;
        }
      }

      const created = m.create(ContactPerson, {
        salutation: contact.salutation ?? null,
        title: contact.title ?? null,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        mobile: contact.mobile ?? null,
        occupation: contact.occupation ?? null,
        nationalities: [],
        preferredLanguages: contact.preferredLanguages ?? [],
        roles: contact.roles ?? [],
        familyId,
        addressId: familyAddressId,
        organizationId,
      });
      const saved = await m.save(created);
      result.createdContacts += 1;
      byTempId.set(contact.tempId, saved.id);
    }
    return byTempId;
  }

  private async familyAddressId(
    m: EntityManager,
    familyId: string,
  ): Promise<string | null> {
    const family = await m.findOne(Family, {
      where: { id: familyId },
      select: ['id', 'primaryAddressId'],
    });
    return family?.primaryAddressId ?? null;
  }

  private async upsertStudents(
    m: EntityManager,
    input: ImportStudentsInput,
    contactIdByTempId: Map<string, string>,
    organizationId: string,
    result: StudentImportResultType,
  ): Promise<void> {
    const updateExisting = input.mode === StudentImportMode.UPDATE_EXISTING;

    for (const student of input.students) {
      let entity: Student | null = null;

      if (student.existingStudentId) {
        entity = await m.findOne(Student, {
          where: { id: student.existingStudentId, organizationId },
        });
      }

      if (entity) {
        if (!updateExisting) {
          result.skippedStudents += 1;
          // Links are still ensured below so a re-import can add guardians
          // the school added to the file after the first run.
          await this.ensureLinks(
            m,
            entity.id,
            student,
            contactIdByTempId,
            organizationId,
            result,
          );
          continue;
        }
        applyFilledStudentFields(entity, student);
        await m.save(entity);
        result.updatedStudents += 1;
      } else {
        entity = await m.save(
          m.create(Student, {
            firstName: student.firstName,
            lastName: student.lastName,
            preferredName: student.preferredName ?? null,
            dateOfBirth: student.dateOfBirth ?? null,
            gender: student.gender ?? null,
            placeOfBirth: student.placeOfBirth ?? null,
            nationalities: student.nationalities ?? null,
            firstLanguages: student.firstLanguages ?? null,
            familyLanguages: student.familyLanguages ?? null,
            religion: student.religion ?? null,
            socialSecurityNumber: student.socialSecurityNumber ?? null,
            externalStudentId: student.externalStudentId ?? null,
            enrollmentDate: student.enrollmentDate ?? null,
            notes: student.notes ?? null,
            organizationId,
          }),
        );
        result.createdStudents += 1;
      }

      await this.ensureLinks(
        m,
        entity.id,
        student,
        contactIdByTempId,
        organizationId,
        result,
      );
      await this.ensureEnrollment(
        m,
        entity.id,
        student,
        organizationId,
        result,
      );
    }
  }

  private async ensureLinks(
    m: EntityManager,
    studentId: string,
    student: StudentImportStudentInput,
    contactIdByTempId: Map<string, string>,
    organizationId: string,
    result: StudentImportResultType,
  ): Promise<void> {
    for (const link of student.links ?? []) {
      const contactPersonId = contactIdByTempId.get(link.contactTempId)!;
      const existing = await m.findOne(StudentContactPerson, {
        where: { studentId, contactPersonId, organizationId },
      });
      if (existing) {
        if (existing.isArchived) {
          existing.isArchived = false;
          await m.save(existing);
        }
        continue;
      }
      if (link.isPrimaryContact) {
        await m.update(
          StudentContactPerson,
          { studentId, organizationId, isPrimaryContact: true },
          { isPrimaryContact: false },
        );
      }
      await m.save(
        m.create(StudentContactPerson, {
          studentId,
          contactPersonId,
          relationshipType: link.relationshipType,
          isPrimaryContact: link.isPrimaryContact ?? false,
          hasCustody: link.hasCustody ?? false,
          isPickupAuthorized: link.isPickupAuthorized ?? true,
          emergencyPriority: link.emergencyPriority ?? null,
          livesWithStudent: link.livesWithStudent ?? false,
          organizationId,
        }),
      );
      result.createdLinks += 1;
    }
  }

  private async ensureEnrollment(
    m: EntityManager,
    studentId: string,
    student: StudentImportStudentInput,
    organizationId: string,
    result: StudentImportResultType,
  ): Promise<void> {
    if (!student.schoolClassId) return;
    const open = await m.findOne(SchoolClassEnrollment, {
      where: {
        studentId,
        schoolClassId: student.schoolClassId,
        organizationId,
        isArchived: false,
      },
    });
    if (open) return;
    await m.save(
      m.create(SchoolClassEnrollment, {
        studentId,
        schoolClassId: student.schoolClassId,
        gradeLevelId: student.gradeLevelId ?? null,
        enrolledAt:
          student.enrollmentDate ?? new Date().toISOString().slice(0, 10),
        organizationId,
      }),
    );
    result.createdEnrollments += 1;
  }
}

function hasAddressValue(address: {
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  countryId?: string;
}): boolean {
  return Boolean(
    address.street ||
    address.houseNumber ||
    address.postalCode ||
    address.city ||
    address.countryId,
  );
}

/**
 * Update semantics: a filled cell overwrites, an empty cell never clears an
 * existing value. Keeps a corrected re-import from wiping data the school
 * maintains in the app.
 */
function applyFilledStudentFields(
  entity: Student,
  input: StudentImportStudentInput,
): void {
  const scalars = [
    'firstName',
    'lastName',
    'preferredName',
    'dateOfBirth',
    'gender',
    'placeOfBirth',
    'religion',
    'socialSecurityNumber',
    'externalStudentId',
    'enrollmentDate',
    'notes',
  ] as const;
  for (const key of scalars) {
    const value = input[key];
    if (value !== undefined && value !== null && value !== '') {
      (entity as unknown as Record<string, unknown>)[key] = value;
    }
  }
  const lists = ['nationalities', 'firstLanguages', 'familyLanguages'] as const;
  for (const key of lists) {
    const value = input[key];
    if (value && value.length > 0) entity[key] = value;
  }
}

function applyFilledContactFields(
  entity: ContactPerson,
  input: StudentImportContactInput,
): void {
  const scalars = [
    'salutation',
    'title',
    'firstName',
    'lastName',
    'email',
    'phone',
    'mobile',
    'occupation',
  ] as const;
  for (const key of scalars) {
    const value = input[key];
    if (value !== undefined && value !== null && value !== '') {
      (entity as unknown as Record<string, unknown>)[key] = value;
    }
  }
  if (input.preferredLanguages && input.preferredLanguages.length > 0) {
    entity.preferredLanguages = input.preferredLanguages;
  }
  for (const role of input.roles ?? []) {
    entity.roles ??= [];
    if (!entity.roles.includes(role)) entity.roles.push(role);
  }
}
