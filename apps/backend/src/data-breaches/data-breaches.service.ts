import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataBreachIncident } from './entities/data-breach-incident.entity';
import { CreateDataBreachInput } from './dto/create-data-breach.input';
import { UpdateDataBreachInput } from './dto/update-data-breach.input';
import { DataBreachStatus } from './enums/data-breach-status.enum';
import { DataBreachRiskLevel } from './enums/data-breach-risk-level.enum';

/** Authority-notification window (DSGVO Art. 33): 72 hours after discovery. */
const AUTHORITY_DEADLINE_HOURS = 72;

@Injectable()
export class DataBreachesService {
  constructor(
    @InjectRepository(DataBreachIncident)
    private readonly breachesRepo: Repository<DataBreachIncident>,
  ) {}

  computeAuthorityNotificationDue(detectedAt: Date): Date {
    return new Date(
      detectedAt.getTime() + AUTHORITY_DEADLINE_HOURS * 3_600_000,
    );
  }

  async findAllByOrgId(
    organizationId: string,
    status?: DataBreachStatus,
  ): Promise<DataBreachIncident[]> {
    return this.breachesRepo.find({
      where: { organizationId, ...(status ? { status } : {}) },
      relations: { assigneeMembership: { user: true } },
      order: { detectedAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
  ): Promise<DataBreachIncident> {
    const incident = await this.breachesRepo.findOne({
      where: { id, organizationId },
      relations: { assigneeMembership: { user: true } },
    });
    if (!incident) {
      throw new NotFoundException(`Data breach ${id} not found`);
    }
    return incident;
  }

  async create(
    input: CreateDataBreachInput,
    organizationId: string,
    createdByMembershipId: string | null,
  ): Promise<DataBreachIncident> {
    const incident = this.breachesRepo.create({
      ...input,
      detectedAt: input.detectedAt ?? new Date(),
      status: DataBreachStatus.OPEN,
      riskLevel: input.riskLevel ?? DataBreachRiskLevel.MEDIUM,
      createdByMembershipId,
      organizationId,
    });
    return this.breachesRepo.save(incident);
  }

  async update(
    input: UpdateDataBreachInput,
    organizationId: string,
  ): Promise<DataBreachIncident> {
    // Load WITHOUT the `assigneeMembership` relation so an assigned
    // `assigneeMembershipId` wins on save (a loaded relation object would
    // silently revert the FK change). Stays org-scoped for isolation.
    const incident = await this.breachesRepo.findOne({
      where: { id: input.id, organizationId },
    });
    if (!incident) {
      throw new NotFoundException(`Data breach ${input.id} not found`);
    }

    const {
      id: _id,
      status,
      authorityNotified,
      subjectsNotified,
      ...rest
    } = input;
    Object.assign(incident, rest);

    if (authorityNotified !== undefined) {
      incident.authorityNotifiedAt = authorityNotified
        ? (incident.authorityNotifiedAt ?? new Date())
        : null;
    }
    if (subjectsNotified !== undefined) {
      incident.subjectsNotifiedAt = subjectsNotified
        ? (incident.subjectsNotifiedAt ?? new Date())
        : null;
    }
    if (status) {
      incident.status = status;
      incident.closedAt =
        status === DataBreachStatus.CLOSED
          ? (incident.closedAt ?? new Date())
          : null;
    }

    await this.breachesRepo.save(incident);
    // Reload with relations for the return value (parity with previous behaviour).
    return this.findOne(input.id, organizationId);
  }
}
