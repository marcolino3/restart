import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AdmissionAuditLog } from './entities/admission-audit-log.entity';
import { AdmissionAuditAction } from './enums/admission-audit-action.enum';

export interface LogAdmissionActionPayload {
  organizationId: string;
  applicationId: string;
  actorMembershipId?: string | null;
  action: AdmissionAuditAction;
  fromStageId?: string | null;
  toStageId?: string | null;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AdmissionAuditLogsService {
  constructor(
    @InjectRepository(AdmissionAuditLog)
    private readonly auditRepo: Repository<AdmissionAuditLog>,
  ) {}

  async findByApplication(
    applicationId: string,
    organizationId: string,
  ): Promise<AdmissionAuditLog[]> {
    return this.auditRepo.find({
      where: { applicationId, organizationId },
      relations: ['fromStage', 'toStage', 'actorMembership'],
      order: { createdAt: 'DESC' },
    });
  }

  async logAction(
    payload: LogAdmissionActionPayload,
    manager?: EntityManager,
  ): Promise<AdmissionAuditLog> {
    const repo = manager
      ? manager.getRepository(AdmissionAuditLog)
      : this.auditRepo;
    const entity = repo.create({
      organizationId: payload.organizationId,
      applicationId: payload.applicationId,
      actorMembershipId: payload.actorMembershipId ?? null,
      action: payload.action,
      fromStageId: payload.fromStageId ?? null,
      toStageId: payload.toStageId ?? null,
      fieldName: payload.fieldName ?? null,
      oldValue: payload.oldValue ?? null,
      newValue: payload.newValue ?? null,
      metadata: payload.metadata ?? null,
    });
    return repo.save(entity);
  }
}
