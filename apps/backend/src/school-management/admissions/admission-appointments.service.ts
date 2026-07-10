import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { AdmissionAppointmentType } from '@/school-management/admission-appointment-types/entities/admission-appointment-type.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { CreateAdmissionAppointmentInput } from './dto/create-admission-appointment.input';
import { UpdateAdmissionAppointmentInput } from './dto/update-admission-appointment.input';
import { AdmissionActivity } from './entities/admission-activity.entity';
import { AdmissionAppointmentAssignee } from './entities/admission-appointment-assignee.entity';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionAppointment } from './entities/admission-appointment.entity';
import { AdmissionActivityType } from './enums/admission-activity-type.enum';

@Injectable()
export class AdmissionAppointmentsService {
  constructor(
    @InjectRepository(AdmissionAppointment)
    private readonly repo: Repository<AdmissionAppointment>,
    @InjectRepository(AdmissionApplication)
    private readonly applicationsRepo: Repository<AdmissionApplication>,
    @InjectRepository(AdmissionAppointmentType)
    private readonly typesRepo: Repository<AdmissionAppointmentType>,
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Validate that every assignee membership belongs to the org, and return the
   * de-duplicated id list. Throws BadRequest on any foreign/unknown membership
   * (multi-tenant isolation).
   */
  private async validateAssignees(
    membershipIds: string[],
    organizationId: string,
  ): Promise<string[]> {
    const unique = [...new Set(membershipIds)];
    if (unique.length === 0) return [];
    const found = await this.membershipsRepo.find({
      where: { id: In(unique), organizationId },
      select: ['id'],
    });
    if (found.length !== unique.length) {
      throw new BadRequestException(
        'One or more assignees are not members of this organization',
      );
    }
    return unique;
  }

  /** Replace an appointment's assignee rows with exactly `membershipIds`. */
  private async syncAssignees(
    appointmentId: string,
    organizationId: string,
    membershipIds: string[],
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(AdmissionAppointmentAssignee);
      await repo.delete({ appointmentId });
      if (membershipIds.length > 0) {
        await repo.save(
          membershipIds.map((membershipId) =>
            repo.create({ organizationId, appointmentId, membershipId }),
          ),
        );
      }
    });
  }

  private async assertApplication(
    applicationId: string,
    organizationId: string,
  ): Promise<void> {
    const application = await this.applicationsRepo.findOne({
      where: { id: applicationId, organizationId },
      select: ['id'],
    });
    if (!application) {
      throw new NotFoundException(
        `Admission application ${applicationId} not found`,
      );
    }
  }

  private async assertAppointmentType(
    appointmentTypeId: string,
    organizationId: string,
  ): Promise<void> {
    const type = await this.typesRepo.findOne({
      where: { id: appointmentTypeId, organizationId },
      select: ['id'],
    });
    if (!type) {
      throw new BadRequestException(
        `Admission appointment type ${appointmentTypeId} not found for this organization`,
      );
    }
  }

  /**
   * Resolve the mirror activity's subject: the appointment title if set,
   * otherwise the appointment type's label, otherwise a generic fallback.
   * Truncated to 200 chars (the activity `subject` column limit).
   */
  private async resolveActivitySubject(
    title: string | null,
    appointmentTypeId: string | null,
    organizationId: string,
    manager?: EntityManager,
  ): Promise<string> {
    const trimmed = title?.trim();
    let subject = trimmed || null;
    if (!subject && appointmentTypeId) {
      const typesRepo = manager
        ? manager.getRepository(AdmissionAppointmentType)
        : this.typesRepo;
      const type = await typesRepo.findOne({
        where: { id: appointmentTypeId, organizationId },
        select: ['label'],
      });
      subject = type?.label ?? null;
    }
    return (subject ?? 'Termin').slice(0, 200);
  }

  /** A period's end must lie strictly after its start. */
  private assertValidPeriod(scheduledAt: Date, endsAt: Date | null): void {
    if (endsAt && endsAt.getTime() <= scheduledAt.getTime()) {
      throw new BadRequestException('Appointment end must be after its start');
    }
  }

  async findByApplication(
    applicationId: string,
    organizationId: string,
  ): Promise<AdmissionAppointment[]> {
    await this.assertApplication(applicationId, organizationId);
    return this.repo.find({
      where: { applicationId, organizationId },
      relations: [
        'appointmentType',
        'assignees',
        'assignees.membership',
        'assignees.membership.user',
      ],
      order: { scheduledAt: 'ASC' },
    });
  }

  /** Reload one appointment with its relations (used after create/update). */
  private findOneWithRelations(
    id: string,
    organizationId: string,
  ): Promise<AdmissionAppointment | null> {
    return this.repo.findOne({
      where: { id, organizationId },
      relations: [
        'appointmentType',
        'assignees',
        'assignees.membership',
        'assignees.membership.user',
      ],
    });
  }

  async create(
    input: CreateAdmissionAppointmentInput,
    organizationId: string,
    createdByMembershipId: string | null,
  ): Promise<AdmissionAppointment> {
    await this.assertApplication(input.applicationId, organizationId);
    if (input.appointmentTypeId) {
      await this.assertAppointmentType(input.appointmentTypeId, organizationId);
    }
    const scheduledAt = new Date(input.scheduledAt);
    const endsAt = input.endsAt ? new Date(input.endsAt) : null;
    this.assertValidPeriod(scheduledAt, endsAt);
    const assigneeIds = await this.validateAssignees(
      input.assignedToMembershipIds ?? [],
      organizationId,
    );
    const title = input.title?.trim() || null;
    const note = input.note?.trim() || null;
    const durationMinutes = input.durationMinutes ?? null;
    const appointmentTypeId = input.appointmentTypeId ?? null;

    // Appointment + its mirror MEETING activity + assignees must land together —
    // a half-written chronicle (activity without appointment or vice versa) is
    // never acceptable, so everything runs in one transaction.
    const savedId = await this.dataSource.transaction(async (manager) => {
      const subject = await this.resolveActivitySubject(
        title,
        appointmentTypeId,
        organizationId,
        manager,
      );
      const activityRepo = manager.getRepository(AdmissionActivity);
      const activity = await activityRepo.save(
        activityRepo.create({
          organizationId,
          applicationId: input.applicationId,
          type: AdmissionActivityType.MEETING,
          occurredAt: scheduledAt,
          subject,
          body: note,
          durationMinutes,
          createdByMembershipId: createdByMembershipId ?? null,
        }),
      );

      const appointmentRepo = manager.getRepository(AdmissionAppointment);
      const saved = await appointmentRepo.save(
        appointmentRepo.create({
          organizationId,
          applicationId: input.applicationId,
          appointmentTypeId,
          title,
          scheduledAt,
          endsAt,
          durationMinutes,
          location: input.location?.trim() || null,
          note,
          createdByMembershipId: createdByMembershipId ?? null,
          activityId: activity.id,
        }),
      );

      const assigneeRepo = manager.getRepository(AdmissionAppointmentAssignee);
      if (assigneeIds.length > 0) {
        await assigneeRepo.save(
          assigneeIds.map((membershipId) =>
            assigneeRepo.create({
              organizationId,
              appointmentId: saved.id,
              membershipId,
            }),
          ),
        );
      }
      return saved.id;
    });

    return (
      (await this.findOneWithRelations(savedId, organizationId)) ??
      (await this.repo.findOneOrFail({
        where: { id: savedId, organizationId },
      }))
    );
  }

  async update(
    input: UpdateAdmissionAppointmentInput,
    organizationId: string,
  ): Promise<AdmissionAppointment> {
    const existing = await this.repo.findOne({
      where: { id: input.id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException(`Appointment ${input.id} not found`);
    }
    if (input.appointmentTypeId !== undefined) {
      if (input.appointmentTypeId) {
        await this.assertAppointmentType(
          input.appointmentTypeId,
          organizationId,
        );
      }
      existing.appointmentTypeId = input.appointmentTypeId ?? null;
    }
    if (input.applicationId !== undefined) {
      await this.assertApplication(input.applicationId, organizationId);
      existing.applicationId = input.applicationId;
    }
    if (input.title !== undefined) {
      existing.title = input.title?.toString().trim() || null;
    }
    if (input.scheduledAt !== undefined) {
      existing.scheduledAt = new Date(input.scheduledAt);
    }
    if (input.endsAt !== undefined) {
      existing.endsAt = input.endsAt ? new Date(input.endsAt) : null;
    }
    // Re-validate the period whenever either endpoint may have changed.
    this.assertValidPeriod(existing.scheduledAt, existing.endsAt ?? null);
    if (input.durationMinutes !== undefined) {
      existing.durationMinutes = input.durationMinutes ?? null;
    }
    if (input.location !== undefined) {
      existing.location = input.location?.toString().trim() || null;
    }
    if (input.note !== undefined) {
      existing.note = input.note?.toString().trim() || null;
    }
    if (input.status !== undefined) {
      existing.status = input.status;
    }

    // Persist the appointment and keep its mirror activity in sync atomically.
    // `existing` was loaded WITHOUT relations, so assigning the `activityId` FK
    // scalar here is honest (no loaded relation object can clobber it on save —
    // the apply-scalar-update principle).
    await this.dataSource.transaction(async (manager) => {
      const subject = await this.resolveActivitySubject(
        existing.title ?? null,
        existing.appointmentTypeId ?? null,
        organizationId,
        manager,
      );
      const activityRepo = manager.getRepository(AdmissionActivity);

      if (existing.activityId) {
        // Sync the linked activity. Org-scoped lookup preserves isolation.
        const activity = await activityRepo.findOne({
          where: { id: existing.activityId, organizationId },
        });
        if (activity) {
          activity.subject = subject;
          activity.occurredAt = existing.scheduledAt;
          activity.body = existing.note ?? null;
          activity.durationMinutes = existing.durationMinutes ?? null;
          activity.applicationId = existing.applicationId;
          await activityRepo.save(activity);
        } else {
          // Linked activity vanished (e.g. deleted directly) — re-create it.
          existing.activityId = null;
        }
      }

      if (!existing.activityId) {
        // Backfill: legacy appointment created before mirror activities existed.
        const activity = await activityRepo.save(
          activityRepo.create({
            organizationId,
            applicationId: existing.applicationId,
            type: AdmissionActivityType.MEETING,
            occurredAt: existing.scheduledAt,
            subject,
            body: existing.note ?? null,
            durationMinutes: existing.durationMinutes ?? null,
            createdByMembershipId: existing.createdByMembershipId ?? null,
          }),
        );
        existing.activityId = activity.id;
      }

      await manager.getRepository(AdmissionAppointment).save(existing);
    });

    if (input.assignedToMembershipIds !== undefined) {
      const assigneeIds = await this.validateAssignees(
        input.assignedToMembershipIds ?? [],
        organizationId,
      );
      await this.syncAssignees(existing.id, organizationId, assigneeIds);
    }
    return (
      (await this.findOneWithRelations(existing.id, organizationId)) ?? existing
    );
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const existing = await this.repo.findOne({
      where: { id, organizationId },
      select: ['id', 'activityId'],
    });
    if (!existing) throw new NotFoundException(`Appointment ${id} not found`);

    // Hard DELETE removes the mirror activity too: the appointment is gone, so
    // its chronicle entry has no reason to linger. (CANCEL is a different path —
    // it runs through update({ status }), which only SYNCS the activity and
    // never deletes it, so a cancelled appointment stays visible in the
    // application's activity history. This asymmetry is intentional.)
    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(AdmissionAppointment)
        .delete({ id, organizationId });
      if (existing.activityId) {
        await manager
          .getRepository(AdmissionActivity)
          .delete({ id: existing.activityId, organizationId });
      }
    });
    return true;
  }
}
