import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AdmissionRejectionReason } from '../admission-rejection-reasons/entities/admission-rejection-reason.entity';
import { AdmissionStage } from '../admission-stages/entities/admission-stage.entity';
import { AdmissionStageType } from '../admission-stages/enums/admission-stage-type.enum';
import { ContactPerson } from '../contact-persons/entities/contact-person.entity';
import { RelationshipType } from '../contact-persons/enums/relationship-type.enum';
import { StudentContactPerson } from '../contact-persons/entities/student-contact-person.entity';
import { Family } from '../families/entities/family.entity';
import { SchoolClassEnrollment } from '../school-class-enrollments/entities/school-class-enrollment.entity';
import { SchoolClass } from '../school-classes/entities/school-class.entity';
import { Student } from '../students/entities/student.entity';
import { AdmissionAuditLogsService } from './admission-audit-logs.service';
import { CreateAdmissionApplicationInput } from './dto/create-admission-application.input';
import { FinalizeEnrollmentInput } from './dto/finalize-enrollment.input';
import { FinalizeEnrollmentOutput } from './dto/finalize-enrollment.output';
import { MoveAdmissionApplicationInput } from './dto/move-application.input';
import { RejectAdmissionApplicationInput } from './dto/reject-application.input';
import { ReorderAdmissionApplicationsInput } from './dto/reorder-applications.input';
import { UpdateAdmissionApplicationInput } from './dto/update-admission-application.input';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionApplicationSource } from './enums/admission-application-source.enum';
import { AdmissionApplicationStatus } from './enums/admission-application-status.enum';
import { AdmissionAuditAction } from './enums/admission-audit-action.enum';

@Injectable()
export class AdmissionApplicationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditLogs: AdmissionAuditLogsService,
    @InjectRepository(AdmissionApplication)
    private readonly applicationsRepo: Repository<AdmissionApplication>,
    @InjectRepository(AdmissionStage)
    private readonly stagesRepo: Repository<AdmissionStage>,
    @InjectRepository(AdmissionRejectionReason)
    private readonly rejectionReasonsRepo: Repository<AdmissionRejectionReason>,
    @InjectRepository(Family)
    private readonly familyRepo: Repository<Family>,
    @InjectRepository(ContactPerson)
    private readonly contactRepo: Repository<ContactPerson>,
  ) {}

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  async findAllByOrgId(
    organizationId: string,
    includeFinished = false,
  ): Promise<AdmissionApplication[]> {
    const where: Record<string, unknown> = { organizationId };
    if (!includeFinished) {
      where.status = AdmissionApplicationStatus.ACTIVE;
    }
    return this.applicationsRepo.find({
      where,
      relations: [
        'family',
        'admissionStage',
        'desiredGradeLevel',
        'desiredSchoolClass',
      ],
      order: { admissionStageId: 'ASC', position: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
  ): Promise<AdmissionApplication> {
    const application = await this.applicationsRepo.findOne({
      where: { id, organizationId },
      relations: [
        'family',
        'admissionStage',
        'desiredGradeLevel',
        'desiredSchoolClass',
        'enrolledStudent',
      ],
    });
    if (!application) {
      throw new NotFoundException(`Admission application ${id} not found`);
    }
    return application;
  }

  async findByFamilyId(
    familyId: string,
    organizationId: string,
  ): Promise<AdmissionApplication[]> {
    return this.applicationsRepo.find({
      where: { familyId, organizationId },
      relations: ['admissionStage'],
      order: { createdAt: 'ASC' },
    });
  }

  // -----------------------------------------------------------------------
  // Create
  // -----------------------------------------------------------------------

  async create(
    input: CreateAdmissionApplicationInput,
    organizationId: string,
    actorMembershipId?: string | null,
  ): Promise<AdmissionApplication> {
    return this.dataSource.transaction(async (manager) => {
      const familyRepo = manager.getRepository(Family);
      const contactRepo = manager.getRepository(ContactPerson);
      const appsRepo = manager.getRepository(AdmissionApplication);
      const stageRepo = manager.getRepository(AdmissionStage);

      // 1) Resolve family
      let family: Family;
      if (input.familyId) {
        const existing = await familyRepo.findOne({
          where: { id: input.familyId, organizationId },
        });
        if (!existing) {
          throw new NotFoundException(`Family ${input.familyId} not found`);
        }
        family = existing;
      } else {
        family = await familyRepo.save(
          familyRepo.create({
            name: input.familyName ?? `Familie ${input.childLastName}`,
            organizationId,
          }),
        );
      }

      // 2) Resolve stage
      let stage: AdmissionStage | null = null;
      if (input.admissionStageId) {
        stage = await stageRepo.findOne({
          where: { id: input.admissionStageId, organizationId },
        });
        if (!stage) {
          throw new NotFoundException(
            `Admission stage ${input.admissionStageId} not found`,
          );
        }
      } else {
        stage =
          (await stageRepo.findOne({
            where: { organizationId, isDefault: true, isArchived: false },
          })) ??
          (await stageRepo.findOne({
            where: { organizationId, isArchived: false },
            order: { position: 'ASC' },
          }));
      }
      if (!stage) {
        throw new BadRequestException(
          'No admission stage configured for this organization',
        );
      }

      // 3) Compute next position in target stage
      const maxRow = await appsRepo
        .createQueryBuilder('a')
        .select('MAX(a.position)', 'max')
        .where('a.organization_id = :orgId', { orgId: organizationId })
        .andWhere('a.admission_stage_id = :stageId', { stageId: stage.id })
        .getRawOne<{ max: number | null }>();
      const position = (maxRow?.max ?? -1) + 1;

      // 4) Create application
      const application = await appsRepo.save(
        appsRepo.create({
          organizationId,
          familyId: family.id,
          admissionStageId: stage.id,
          childFirstName: input.childFirstName,
          childLastName: input.childLastName,
          childDateOfBirth: input.childDateOfBirth ?? null,
          childGender: input.childGender ?? null,
          childNotes: input.childNotes ?? null,
          desiredGradeLevelId: input.desiredGradeLevelId ?? null,
          desiredSchoolClassId: input.desiredSchoolClassId ?? null,
          desiredEnrollmentDate: input.desiredEnrollmentDate ?? null,
          status: AdmissionApplicationStatus.ACTIVE,
          source: input.source ?? AdmissionApplicationSource.MANUAL,
          position,
          stageEnteredAt: new Date(),
        }),
      );

      // 5) Create contact persons attached to family
      if (input.contactPersons?.length) {
        for (const cp of input.contactPersons) {
          await contactRepo.save(
            contactRepo.create({
              ...cp,
              roles: cp.roles ?? [],
              nationalities: cp.nationalities ?? [],
              preferredLanguages: cp.preferredLanguages ?? [],
              organizationId,
              familyId: family.id,
            }),
          );
        }
      }

      // 6) Audit
      await this.auditLogs.logAction(
        {
          organizationId,
          applicationId: application.id,
          actorMembershipId: actorMembershipId ?? null,
          action: AdmissionAuditAction.CREATED,
          toStageId: stage.id,
        },
        manager,
      );

      return application;
    });
  }

  // -----------------------------------------------------------------------
  // Update
  // -----------------------------------------------------------------------

  async update(
    input: UpdateAdmissionApplicationInput,
    organizationId: string,
    actorMembershipId?: string | null,
  ): Promise<AdmissionApplication> {
    const application = await this.findOne(input.id, organizationId);
    const { id: _id, ...rest } = input;
    Object.assign(application, rest);
    await this.applicationsRepo.save(application);

    await this.auditLogs.logAction({
      organizationId,
      applicationId: application.id,
      actorMembershipId: actorMembershipId ?? null,
      action: AdmissionAuditAction.FIELD_UPDATED,
      metadata: { fields: Object.keys(rest) },
    });

    return this.findOne(input.id, organizationId);
  }

  // -----------------------------------------------------------------------
  // Move
  // -----------------------------------------------------------------------

  async move(
    input: MoveAdmissionApplicationInput,
    organizationId: string,
    actorMembershipId?: string | null,
  ): Promise<AdmissionApplication> {
    return this.dataSource.transaction(async (manager) => {
      const appsRepo = manager.getRepository(AdmissionApplication);
      const stageRepo = manager.getRepository(AdmissionStage);

      const application = await appsRepo.findOne({
        where: { id: input.id, organizationId },
      });
      if (!application) {
        throw new NotFoundException(
          `Admission application ${input.id} not found`,
        );
      }
      const toStage = await stageRepo.findOne({
        where: { id: input.toStageId, organizationId },
      });
      if (!toStage) {
        throw new NotFoundException(
          `Admission stage ${input.toStageId} not found`,
        );
      }

      const fromStageId = application.admissionStageId;
      const stageChanged = fromStageId !== toStage.id;

      // determine position
      let newPosition = input.position;
      if (newPosition === undefined || newPosition === null) {
        const maxRow = await appsRepo
          .createQueryBuilder('a')
          .select('MAX(a.position)', 'max')
          .where('a.organization_id = :orgId', { orgId: organizationId })
          .andWhere('a.admission_stage_id = :stageId', {
            stageId: toStage.id,
          })
          .getRawOne<{ max: number | null }>();
        newPosition = (maxRow?.max ?? -1) + 1;
      }

      application.admissionStageId = toStage.id;
      application.position = newPosition;
      if (stageChanged) {
        application.stageEnteredAt = new Date();
      }
      await appsRepo.save(application);

      if (stageChanged) {
        await this.auditLogs.logAction(
          {
            organizationId,
            applicationId: application.id,
            actorMembershipId: actorMembershipId ?? null,
            action: AdmissionAuditAction.STAGE_CHANGED,
            fromStageId,
            toStageId: toStage.id,
          },
          manager,
        );
      }

      return application;
    });
  }

  async reorderInStage(
    input: ReorderAdmissionApplicationsInput,
    organizationId: string,
  ): Promise<AdmissionApplication[]> {
    return this.dataSource.transaction(async (manager) => {
      const appsRepo = manager.getRepository(AdmissionApplication);
      const apps = await appsRepo.find({
        where: {
          id: In(input.applicationIds),
          organizationId,
          admissionStageId: input.stageId,
        },
      });
      if (apps.length !== input.applicationIds.length) {
        throw new NotFoundException(
          'One or more applications not found in this stage',
        );
      }
      const byId = new Map(apps.map((a) => [a.id, a]));
      const toSave = input.applicationIds.map((id, index) => {
        const a = byId.get(id)!;
        a.position = index;
        return a;
      });
      await appsRepo.save(toSave);
      return appsRepo.find({
        where: { admissionStageId: input.stageId, organizationId },
        order: { position: 'ASC' },
      });
    });
  }

  // -----------------------------------------------------------------------
  // Status changes
  // -----------------------------------------------------------------------

  async archive(
    id: string,
    organizationId: string,
    actorMembershipId?: string | null,
  ): Promise<boolean> {
    const application = await this.findOne(id, organizationId);
    application.status = AdmissionApplicationStatus.ARCHIVED;
    application.isArchived = true;
    await this.applicationsRepo.save(application);
    await this.auditLogs.logAction({
      organizationId,
      applicationId: id,
      actorMembershipId: actorMembershipId ?? null,
      action: AdmissionAuditAction.ARCHIVED,
    });
    return true;
  }

  async restore(
    id: string,
    organizationId: string,
    actorMembershipId?: string | null,
  ): Promise<AdmissionApplication> {
    const application = await this.findOne(id, organizationId);
    application.status = AdmissionApplicationStatus.ACTIVE;
    application.isArchived = false;
    await this.applicationsRepo.save(application);
    await this.auditLogs.logAction({
      organizationId,
      applicationId: id,
      actorMembershipId: actorMembershipId ?? null,
      action: AdmissionAuditAction.RESTORED,
    });
    return this.findOne(id, organizationId);
  }

  /**
   * Hard-delete an admission application along with its audit log entries
   * (cascade via FK). Refused if an enrolled student already references it —
   * the user should archive in that case.
   */
  async hardDelete(id: string, organizationId: string): Promise<boolean> {
    const application = await this.findOne(id, organizationId);
    if (application.enrolledStudentId) {
      throw new BadRequestException(
        'Cannot delete an application that has already been enrolled. Archive it instead.',
      );
    }
    await this.applicationsRepo.delete({ id, organizationId });
    return true;
  }

  async reject(
    input: RejectAdmissionApplicationInput,
    organizationId: string,
    actorMembershipId?: string | null,
  ): Promise<AdmissionApplication> {
    const application = await this.findOne(input.id, organizationId);
    application.status = AdmissionApplicationStatus.REJECTED;
    application.rejectionReason = input.reason ?? null;

    // Validate the chosen reason belongs to this org (multi-tenant safety).
    if (input.rejectionReasonId) {
      const reason = await this.rejectionReasonsRepo.findOne({
        where: { id: input.rejectionReasonId, organizationId },
      });
      if (!reason) {
        throw new NotFoundException(
          `Rejection reason ${input.rejectionReasonId} not found`,
        );
      }
      application.rejectionReasonId = reason.id;
    } else {
      application.rejectionReasonId = null;
    }

    application.rejectedBy = input.rejectedBy ?? null;
    application.followUpYear = input.followUpYear?.trim() || null;

    // best-effort: move to a REJECTED stage if exists
    const rejectedStage = await this.stagesRepo.findOne({
      where: {
        organizationId,
        stageType: AdmissionStageType.REJECTED,
        isArchived: false,
      },
      order: { position: 'ASC' },
    });
    if (rejectedStage) {
      application.admissionStageId = rejectedStage.id;
      application.stageEnteredAt = new Date();
    }
    await this.applicationsRepo.save(application);

    await this.auditLogs.logAction({
      organizationId,
      applicationId: input.id,
      actorMembershipId: actorMembershipId ?? null,
      action: AdmissionAuditAction.REJECTED,
      newValue: input.reason ?? null,
    });
    return this.findOne(input.id, organizationId);
  }

  // -----------------------------------------------------------------------
  // Finalize enrollment
  // -----------------------------------------------------------------------

  async finalizeEnrollment(
    input: FinalizeEnrollmentInput,
    organizationId: string,
    actorMembershipId?: string | null,
  ): Promise<FinalizeEnrollmentOutput> {
    return this.dataSource.transaction(async (manager) => {
      const appsRepo = manager.getRepository(AdmissionApplication);
      const stageRepo = manager.getRepository(AdmissionStage);
      const familyRepo = manager.getRepository(Family);
      const contactRepo = manager.getRepository(ContactPerson);
      const studentRepo = manager.getRepository(Student);
      const scpRepo = manager.getRepository(StudentContactPerson);
      const enrollmentRepo = manager.getRepository(SchoolClassEnrollment);
      const classRepo = manager.getRepository(SchoolClass);

      const application = await appsRepo.findOne({
        where: { id: input.applicationId, organizationId },
      });
      if (!application) {
        throw new NotFoundException(
          `Admission application ${input.applicationId} not found`,
        );
      }
      if (application.status === AdmissionApplicationStatus.ENROLLED) {
        throw new BadRequestException(
          'Application is already marked as enrolled',
        );
      }

      const schoolClass = await classRepo.findOne({
        where: { id: input.schoolClassId, organizationId },
      });
      if (!schoolClass) {
        throw new NotFoundException(
          `School class ${input.schoolClassId} not found`,
        );
      }

      const family = await familyRepo.findOne({
        where: { id: application.familyId, organizationId },
      });
      if (!family) {
        throw new NotFoundException(`Family ${application.familyId} not found`);
      }

      // Resolve target ENROLLED stage (if available)
      const enrolledStage = await stageRepo.findOne({
        where: {
          organizationId,
          stageType: AdmissionStageType.ENROLLED,
          isArchived: false,
        },
        order: { position: 'ASC' },
      });

      // 1) Create Student
      const student = await studentRepo.save(
        studentRepo.create({
          firstName: application.childFirstName,
          lastName: application.childLastName,
          dateOfBirth: application.childDateOfBirth ?? null,
          gender: application.childGender ?? null,
          enrollmentDate: input.enrollmentDate,
          admissionStageId: enrolledStage?.id ?? application.admissionStageId,
          admissionApplicationId: application.id,
          organizationId,
        }),
      );

      // 2) Mirror family ContactPersons to StudentContactPerson
      const contacts = await contactRepo.find({
        where: { familyId: family.id, organizationId, isArchived: false },
      });
      for (const contact of contacts) {
        const relationshipType =
          contact.roles?.[0] ?? RelationshipType.LEGAL_GUARDIAN;
        await scpRepo.save(
          scpRepo.create({
            studentId: student.id,
            contactPersonId: contact.id,
            relationshipType,
            isPrimaryContact: contact.roles?.includes(RelationshipType.MOTHER)
              ? true
              : contact.roles?.includes(RelationshipType.FATHER)
                ? true
                : false,
            hasCustody: contact.roles?.some((r) =>
              [
                RelationshipType.MOTHER,
                RelationshipType.FATHER,
                RelationshipType.LEGAL_GUARDIAN,
              ].includes(r),
            )
              ? true
              : false,
            isPickupAuthorized: true,
            livesWithStudent: false,
            organizationId,
          }),
        );
      }

      // 3) School class enrollment
      await enrollmentRepo.save(
        enrollmentRepo.create({
          studentId: student.id,
          schoolClassId: schoolClass.id,
          enrolledAt: input.enrollmentDate,
          organizationId,
        }),
      );

      // 4) Update application
      const fromStageId = application.admissionStageId;
      application.status = AdmissionApplicationStatus.ENROLLED;
      application.enrolledStudentId = student.id;
      if (enrolledStage && enrolledStage.id !== application.admissionStageId) {
        application.admissionStageId = enrolledStage.id;
        application.stageEnteredAt = new Date();
      }
      await appsRepo.save(application);

      // 5) Audit
      await this.auditLogs.logAction(
        {
          organizationId,
          applicationId: application.id,
          actorMembershipId: actorMembershipId ?? null,
          action: AdmissionAuditAction.ENROLLED,
          fromStageId,
          toStageId: application.admissionStageId,
          metadata: {
            studentId: student.id,
            schoolClassId: schoolClass.id,
            enrollmentDate: input.enrollmentDate,
          },
        },
        manager,
      );

      return { application, student };
    });
  }
}
