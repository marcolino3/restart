import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import {
  EmployeeAuditLog,
  EmployeeAuditLogEntityType,
} from './entities/employee-audit-log.entity';

export interface AuditLogChange {
  entityType: EmployeeAuditLogEntityType;
  fieldName: string;
  oldValue?: string | null;
  newValue?: string | null;
}

@Injectable()
export class EmployeeAuditLogService {
  constructor(private readonly entityManager: EntityManager) {}

  async logChanges(
    employeeId: string,
    organizationId: string,
    actorMembershipId: string | undefined | null,
    changes: AuditLogChange[],
    manager?: EntityManager,
  ): Promise<void> {
    if (!changes.length) return;

    const m = manager ?? this.entityManager;

    const entries = changes.map((c) =>
      m.create(EmployeeAuditLog, {
        employeeId,
        organizationId,
        actorMembershipId: actorMembershipId ?? null,
        entityType: c.entityType,
        fieldName: c.fieldName,
        oldValue: c.oldValue ?? null,
        newValue: c.newValue ?? null,
      }),
    );

    await m.save(EmployeeAuditLog, entries);
  }

  async findByEmployeeId(
    employeeId: string,
    organizationId: string,
  ): Promise<EmployeeAuditLog[]> {
    return this.entityManager.find(EmployeeAuditLog, {
      where: { employeeId, organizationId },
      relations: { actorMembership: { user: true } },
      order: { createdAt: 'DESC' },
    });
  }
}
