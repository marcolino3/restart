import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSubjectRequest } from './entities/data-subject-request.entity';
import { CreateDataSubjectRequestInput } from './dto/create-data-subject-request.input';
import { UpdateDataSubjectRequestInput } from './dto/update-data-subject-request.input';
import { DataSubjectRequestStatus } from './enums/data-subject-request-status.enum';
import { DataSubjectType } from './enums/data-subject-type.enum';

/** Statutory response deadline: 1 month (DSGVO Art. 12(3) / revDSG). */
const DEADLINE_DAYS = 30;

@Injectable()
export class DataSubjectRequestsService {
  constructor(
    @InjectRepository(DataSubjectRequest)
    private readonly requestsRepo: Repository<DataSubjectRequest>,
  ) {}

  private computeDueDate(receivedAt: Date): Date {
    const due = new Date(receivedAt);
    due.setDate(due.getDate() + DEADLINE_DAYS);
    return due;
  }

  private isTerminal(status: DataSubjectRequestStatus): boolean {
    return (
      status === DataSubjectRequestStatus.COMPLETED ||
      status === DataSubjectRequestStatus.REJECTED
    );
  }

  async findAllByOrgId(
    organizationId: string,
    status?: DataSubjectRequestStatus,
  ): Promise<DataSubjectRequest[]> {
    return this.requestsRepo.find({
      where: { organizationId, ...(status ? { status } : {}) },
      relations: { assigneeMembership: { user: true } },
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
  ): Promise<DataSubjectRequest> {
    const request = await this.requestsRepo.findOne({
      where: { id, organizationId },
      relations: { assigneeMembership: { user: true } },
    });
    if (!request) {
      throw new NotFoundException(`Data-subject request ${id} not found`);
    }
    return request;
  }

  async create(
    input: CreateDataSubjectRequestInput,
    organizationId: string,
    createdByMembershipId: string | null,
  ): Promise<DataSubjectRequest> {
    const receivedAt = input.receivedAt ?? new Date();
    const request = this.requestsRepo.create({
      ...input,
      receivedAt,
      dueDate: this.computeDueDate(receivedAt),
      subjectType: input.subjectType ?? DataSubjectType.OTHER,
      status: DataSubjectRequestStatus.NEW,
      createdByMembershipId,
      organizationId,
    });
    return this.requestsRepo.save(request);
  }

  async update(
    input: UpdateDataSubjectRequestInput,
    organizationId: string,
  ): Promise<DataSubjectRequest> {
    // Load WITHOUT the `assigneeMembership` relation so an assigned
    // `assigneeMembershipId` wins on save (a loaded relation object would
    // silently revert the FK change). Stays org-scoped for isolation.
    const request = await this.requestsRepo.findOne({
      where: { id: input.id, organizationId },
    });
    if (!request) {
      throw new NotFoundException(`Data-subject request ${input.id} not found`);
    }

    const { id: _id, status, receivedAt, ...rest } = input;
    Object.assign(request, rest);

    if (receivedAt) {
      request.receivedAt = receivedAt;
      request.dueDate = this.computeDueDate(receivedAt);
    }

    if (status) {
      request.status = status;
      // Terminal states stamp resolvedAt once (proof the deadline was met);
      // re-opening clears it.
      request.resolvedAt = this.isTerminal(status)
        ? (request.resolvedAt ?? new Date())
        : null;
    }

    await this.requestsRepo.save(request);
    // Reload with relations for the return value (parity with previous behaviour).
    return this.findOne(input.id, organizationId);
  }
}
