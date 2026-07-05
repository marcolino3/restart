import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

import { Student } from '@/school-management/students/entities/student.entity';
import { StudentNote } from '@/school-management/student-notes/entities/student-note.entity';
import { StudentContactPerson } from '@/school-management/contact-persons/entities/student-contact-person.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { EmployeeNote } from '@/employee-management/employee-notes/entities/employee-note.entity';
import { EmployeeEmergencyProfile } from '@/employee-management/employee-emergency/entities/employee-emergency-profile.entity';
import { Consent } from '@/consent/entities/consent.entity';
import { ConsentSubjectType } from '@/consent/enums/consent-subject-type.enum';
import { DataSubjectRequest } from '@/data-requests/entities/data-subject-request.entity';
import { DataSubjectType } from '@/data-requests/enums/data-subject-type.enum';

type ExportBundle = Record<string, unknown>;

/**
 * Assembles a machine-readable export of everything the org holds about one
 * data subject (DSGVO Art. 15 access / Art. 20 portability). Every query is
 * scoped to the caller's organization — a subject from another org is not found.
 * Read-only.
 */
@Injectable()
export class DataExportService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async export(
    subjectType: DataSubjectType,
    subjectId: string,
    organizationId: string,
  ): Promise<ExportBundle> {
    switch (subjectType) {
      case DataSubjectType.STUDENT:
        return this.buildStudentExport(subjectId, organizationId);
      case DataSubjectType.EMPLOYEE:
        return this.buildEmployeeExport(subjectId, organizationId);
      default:
        throw new BadRequestException(
          `Export is not supported for subject type ${subjectType}`,
        );
    }
  }

  private async commonSubjectData(
    consentSubjectType: ConsentSubjectType,
    subjectId: string,
    organizationId: string,
  ): Promise<Pick<ExportBundle, 'consents' | 'dataSubjectRequests'>> {
    const consents = await this.entityManager.find(Consent, {
      where: { subjectType: consentSubjectType, subjectId, organizationId },
      relations: { purpose: true },
    });
    const requests = await this.entityManager.find(DataSubjectRequest, {
      where: { subjectId, organizationId },
    });
    return {
      consents: consents.map((c) => ({
        purpose: c.purpose?.name ?? c.purposeId,
        status: c.status,
        decidedAt: c.decidedAt,
        withdrawnAt: c.withdrawnAt,
        note: c.note,
      })),
      dataSubjectRequests: requests.map((r) => ({
        type: r.type,
        status: r.status,
        receivedAt: r.receivedAt,
        dueDate: r.dueDate,
        resolvedAt: r.resolvedAt,
      })),
    };
  }

  private async buildStudentExport(
    id: string,
    organizationId: string,
  ): Promise<ExportBundle> {
    const student = await this.entityManager.findOne(Student, {
      where: { id, organizationId },
    });
    if (!student) {
      throw new NotFoundException(`Student ${id} not found`);
    }

    const notes = await this.entityManager.find(StudentNote, {
      where: { studentId: id, organizationId },
    });
    const guardians = await this.entityManager.find(StudentContactPerson, {
      where: { studentId: id, organizationId },
      relations: { contactPerson: true },
    });
    const common = await this.commonSubjectData(
      ConsentSubjectType.STUDENT,
      id,
      organizationId,
    );

    return {
      exportType: 'STUDENT',
      generatedAt: new Date().toISOString(),
      subject: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        enrollmentDate: student.enrollmentDate,
        exitDate: student.exitDate,
        notes: student.notes,
      },
      guardians: guardians.map((g) => ({
        relationshipType: g.relationshipType,
        hasCustody: g.hasCustody,
        isPrimaryContact: g.isPrimaryContact,
        contactPerson: g.contactPerson
          ? {
              firstName: g.contactPerson.firstName,
              lastName: g.contactPerson.lastName,
              email: g.contactPerson.email,
              phone: g.contactPerson.phone,
              mobile: g.contactPerson.mobile,
            }
          : null,
      })),
      logbook: notes.map((n) => ({
        date: n.date,
        category: n.category,
        title: n.title,
        content: n.content,
      })),
      ...common,
    };
  }

  private async buildEmployeeExport(
    id: string,
    organizationId: string,
  ): Promise<ExportBundle> {
    const employee = await this.entityManager.findOne(Employee, {
      where: { id },
      relations: { membership: { user: { userEmails: true } } },
    });
    if (!employee || employee.membership?.organizationId !== organizationId) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    const user = employee.membership.user;

    const emergency = await this.entityManager.findOne(
      EmployeeEmergencyProfile,
      { where: { employeeId: id, organizationId } },
    );
    const notes = await this.entityManager.find(EmployeeNote, {
      where: { employeeId: id, organizationId },
    });
    const common = await this.commonSubjectData(
      ConsentSubjectType.EMPLOYEE,
      id,
      organizationId,
    );

    return {
      exportType: 'EMPLOYEE',
      generatedAt: new Date().toISOString(),
      subject: {
        id: employee.id,
        status: employee.status,
        firstName: user?.firstName,
        lastName: user?.lastName,
        dateOfBirth: user?.dateOfBirth,
        socialSecurityNumber: user?.socialSecurityNumber,
        privateEmail: user?.privateEmail,
        loginEmails: user?.userEmails?.map((e) => e.email) ?? [],
        address: {
          street: user?.street,
          houseNumber: user?.houseNumber,
          addressLine2: user?.addressLine2,
          postalCode: user?.postalCode,
          city: user?.city,
          country: user?.country,
        },
      },
      emergencyProfile: emergency
        ? {
            contact1Name: emergency.contact1Name,
            contact1Phone: emergency.contact1Phone,
            contact2Name: emergency.contact2Name,
            contact2Phone: emergency.contact2Phone,
            bloodType: emergency.bloodType,
            allergies: emergency.allergies,
            chronicConditions: emergency.chronicConditions,
            emergencyMedications: emergency.emergencyMedications,
            primaryDoctorName: emergency.primaryDoctorName,
          }
        : null,
      logbook: notes.map((n) => ({
        date: n.date,
        category: n.category,
        title: n.title,
        content: n.content,
      })),
      ...common,
    };
  }
}
