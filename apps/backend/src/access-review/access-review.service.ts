import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

import { Membership } from '@/memberships/entities/membership.entity';
import { AccessReviewRecord } from './entities/access-review-record.entity';
import { AccessReviewEntry } from './dto/access-review-entry.output';

/**
 * Permissions considered to grant access to sensitive personal data
 * (HR/health, children's records, breach + export of all personal data).
 * Members holding any of these appear in the access review.
 */
const SENSITIVE_CODES = new Set<string>([
  'EMPLOYEE_WRITE',
  'RECORD_KEEPING_WRITE',
  'CONSENT_MANAGE',
  'DATA_REQUEST_MANAGE',
  'DATA_BREACH_MANAGE',
]);

@Injectable()
export class AccessReviewService {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async getReview(organizationId: string): Promise<AccessReviewEntry[]> {
    const memberships = await this.entityManager.find(Membership, {
      where: { organizationId },
      relations: { user: true, roles: { permissions: true } },
    });
    const records = await this.entityManager.find(AccessReviewRecord, {
      where: { organizationId },
    });
    const recordByMember = new Map(records.map((r) => [r.membershipId, r]));

    const entries: AccessReviewEntry[] = [];
    for (const membership of memberships) {
      const codes = new Set<string>();
      const roleNames: string[] = [];
      for (const role of membership.roles ?? []) {
        roleNames.push(role.name ?? role.systemCode ?? '—');
        for (const permission of role.permissions ?? []) {
          if (SENSITIVE_CODES.has(permission.code)) codes.add(permission.code);
        }
      }
      if (codes.size === 0) continue;

      const name = `${membership.user?.firstName ?? ''} ${
        membership.user?.lastName ?? ''
      }`.trim();
      entries.push({
        membershipId: membership.id,
        memberName: name || '—',
        roles: roleNames,
        sensitivePermissions: Array.from(codes),
        lastReviewedAt:
          recordByMember.get(membership.id)?.lastReviewedAt ?? null,
      });
    }

    entries.sort((a, b) => a.memberName.localeCompare(b.memberName));
    return entries;
  }

  async recertify(
    membershipId: string,
    organizationId: string,
    reviewerMembershipId: string | null,
    note?: string,
  ): Promise<boolean> {
    let record = await this.entityManager.findOne(AccessReviewRecord, {
      where: { organizationId, membershipId },
    });
    if (!record) {
      record = this.entityManager.create(AccessReviewRecord, {
        organizationId,
        membershipId,
      });
    }
    record.lastReviewedAt = new Date();
    record.reviewedByMembershipId = reviewerMembershipId;
    if (note !== undefined) record.note = note || null;
    await this.entityManager.save(AccessReviewRecord, record);
    return true;
  }
}
