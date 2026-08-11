import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OrganizationAuditLog } from '@/organizations/entities/organization-audit-log.entity';
import type { OrganizationAuditAction } from '@restart/shared-schemas/organizations/organization-enums';

@Injectable()
export class OrganizationAuditLogService {
  constructor(
    @InjectRepository(OrganizationAuditLog)
    private readonly auditLogRepo: Repository<OrganizationAuditLog>,
  ) {}

  async record(
    organizationId: string,
    action: OrganizationAuditAction,
    actorUserId?: string,
    payload?: Record<string, unknown>,
  ): Promise<OrganizationAuditLog> {
    const entry = this.auditLogRepo.create({
      organizationId,
      action,
      actorUserId,
      payload,
    });
    return this.auditLogRepo.save(entry);
  }

  async findPaginated(
    organizationId: string,
    limit: number,
    offset: number,
  ): Promise<{ items: OrganizationAuditLog[]; total: number }> {
    const [items, total] = await this.auditLogRepo.findAndCount({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['actorUser'],
    });
    return { items, total };
  }
}
