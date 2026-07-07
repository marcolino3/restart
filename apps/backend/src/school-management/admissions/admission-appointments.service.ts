import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AdmissionAppointmentType } from '@/school-management/admission-appointment-types/entities/admission-appointment-type.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { CreateAdmissionAppointmentInput } from './dto/create-admission-appointment.input';
import { UpdateAdmissionAppointmentInput } from './dto/update-admission-appointment.input';
import { AdmissionAppointmentAssignee } from './entities/admission-appointment-assignee.entity';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionAppointment } from './entities/admission-appointment.entity';

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
    const entity = this.repo.create({
      organizationId,
      applicationId: input.applicationId,
      appointmentTypeId: input.appointmentTypeId ?? null,
      scheduledAt,
      endsAt,
      durationMinutes: input.durationMinutes ?? null,
      location: input.location?.trim() || null,
      note: input.note?.trim() || null,
      createdByMembershipId: createdByMembershipId ?? null,
    });
    const saved = await this.repo.save(entity);
    await this.syncAssignees(saved.id, organizationId, assigneeIds);
    return (await this.findOneWithRelations(saved.id, organizationId)) ?? saved;
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
    await this.repo.save(existing);
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
      select: ['id'],
    });
    if (!existing) throw new NotFoundException(`Appointment ${id} not found`);
    await this.repo.delete({ id, organizationId });
    return true;
  }
}
