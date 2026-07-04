import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, LessThanOrEqual, Repository } from 'typeorm';

import { Student } from '@/school-management/students/entities/student.entity';
import { DataSubjectRequest } from '@/data-requests/entities/data-subject-request.entity';
import { RetentionPolicy } from './entities/retention-policy.entity';
import { UpsertRetentionPolicyInput } from './dto/upsert-retention-policy.input';
import { RetentionAction } from './enums/retention-action.enum';
import { RetentionEntityType } from './enums/retention-entity-type.enum';

@Injectable()
export class RetentionPoliciesService {
  constructor(
    @InjectRepository(RetentionPolicy)
    private readonly policiesRepo: Repository<RetentionPolicy>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async findAllByOrgId(organizationId: string): Promise<RetentionPolicy[]> {
    return this.policiesRepo.find({
      where: { organizationId },
      order: { entityType: 'ASC' },
    });
  }

  async upsert(
    input: UpsertRetentionPolicyInput,
    organizationId: string,
  ): Promise<RetentionPolicy> {
    let policy = await this.policiesRepo.findOne({
      where: { organizationId, entityType: input.entityType },
    });
    if (!policy) {
      policy = this.policiesRepo.create({
        organizationId,
        entityType: input.entityType,
        action: RetentionAction.ANONYMIZE,
        isEnabled: true,
      });
    }

    policy.retentionMonths = input.retentionMonths;
    if (input.action) policy.action = input.action;
    if (input.description !== undefined) {
      policy.description = input.description || null;
    }
    if (input.isEnabled !== undefined) policy.isEnabled = input.isEnabled;

    return this.policiesRepo.save(policy);
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const policy = await this.policiesRepo.findOne({
      where: { id, organizationId },
    });
    if (!policy) {
      throw new NotFoundException(`Retention policy ${id} not found`);
    }
    await this.policiesRepo.remove(policy);
    return true;
  }

  /**
   * How many records currently fall past the retention period. Read-only
   * preview — nothing is deleted here. Returns null for types without a wired
   * anchor date yet.
   */
  async computeDueCount(
    entityType: RetentionEntityType,
    retentionMonths: number,
    organizationId: string,
  ): Promise<number | null> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - retentionMonths);

    switch (entityType) {
      case RetentionEntityType.STUDENT: {
        const cutoffDate = cutoff.toISOString().slice(0, 10);
        return this.entityManager.count(Student, {
          where: { organizationId, exitDate: LessThanOrEqual(cutoffDate) },
        });
      }
      case RetentionEntityType.DATA_SUBJECT_REQUEST:
        return this.entityManager.count(DataSubjectRequest, {
          where: { organizationId, resolvedAt: LessThanOrEqual(cutoff) },
        });
      default:
        return null;
    }
  }
}
