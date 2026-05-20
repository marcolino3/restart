import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAdmissionActivityInput } from './dto/create-admission-activity.input';
import { UpdateAdmissionActivityInput } from './dto/update-admission-activity.input';
import { AdmissionActivity } from './entities/admission-activity.entity';
import { AdmissionApplication } from './entities/admission-application.entity';

@Injectable()
export class AdmissionActivitiesService {
  constructor(
    @InjectRepository(AdmissionActivity)
    private readonly repo: Repository<AdmissionActivity>,
    @InjectRepository(AdmissionApplication)
    private readonly applicationsRepo: Repository<AdmissionApplication>,
  ) {}

  async findByApplication(
    applicationId: string,
    organizationId: string,
  ): Promise<AdmissionActivity[]> {
    // Confirm application belongs to this org — prevents cross-tenant probing.
    const application = await this.applicationsRepo.findOne({
      where: { id: applicationId, organizationId },
      select: ['id'],
    });
    if (!application) {
      throw new NotFoundException(
        `Admission application ${applicationId} not found`,
      );
    }
    return this.repo.find({
      where: { applicationId, organizationId },
      relations: ['createdByMembership', 'createdByMembership.user'],
      order: { occurredAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(
    input: CreateAdmissionActivityInput,
    organizationId: string,
    createdByMembershipId: string | null,
  ): Promise<AdmissionActivity> {
    const application = await this.applicationsRepo.findOne({
      where: { id: input.applicationId, organizationId },
      select: ['id'],
    });
    if (!application) {
      throw new NotFoundException(
        `Admission application ${input.applicationId} not found`,
      );
    }
    const entity = this.repo.create({
      organizationId,
      applicationId: input.applicationId,
      type: input.type,
      occurredAt: new Date(input.occurredAt),
      subject: input.subject?.trim() || null,
      body: input.body?.trim() || null,
      direction: input.direction ?? null,
      durationMinutes: input.durationMinutes ?? null,
      location: input.location?.trim() || null,
      createdByMembershipId: createdByMembershipId ?? null,
    });
    return this.repo.save(entity);
  }

  async update(
    input: UpdateAdmissionActivityInput,
    organizationId: string,
  ): Promise<AdmissionActivity> {
    const existing = await this.repo.findOne({
      where: { id: input.id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException(`Admission activity ${input.id} not found`);
    }

    if (input.type !== undefined) existing.type = input.type;
    if (input.occurredAt !== undefined) {
      existing.occurredAt = new Date(input.occurredAt);
    }
    if (input.subject !== undefined) {
      existing.subject = input.subject?.toString().trim() || null;
    }
    if (input.body !== undefined) {
      existing.body = input.body?.toString().trim() || null;
    }
    if (input.direction !== undefined) {
      existing.direction = input.direction ?? null;
    }
    if (input.durationMinutes !== undefined) {
      existing.durationMinutes = input.durationMinutes ?? null;
    }
    if (input.location !== undefined) {
      existing.location = input.location?.toString().trim() || null;
    }
    return this.repo.save(existing);
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const existing = await this.repo.findOne({
      where: { id, organizationId },
      select: ['id'],
    });
    if (!existing) {
      throw new NotFoundException(`Admission activity ${id} not found`);
    }
    await this.repo.delete({ id, organizationId });
    return true;
  }
}
