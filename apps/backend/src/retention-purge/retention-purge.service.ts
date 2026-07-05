import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, LessThanOrEqual } from 'typeorm';

import { Organization } from '@/organizations/entities/organization.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { DataSubjectRequest } from '@/data-requests/entities/data-subject-request.entity';
import { Consent } from '@/consent/entities/consent.entity';
import { ConsentSubjectType } from '@/consent/enums/consent-subject-type.enum';
import { RetentionPolicy } from '@/retention/entities/retention-policy.entity';
import { RetentionAction } from '@/retention/enums/retention-action.enum';
import { RetentionEntityType } from '@/retention/enums/retention-entity-type.enum';
import { PurgeCandidate } from './entities/purge-candidate.entity';
import { PurgeStatus } from './enums/purge-status.enum';

@Injectable()
export class RetentionPurgeService {
  private readonly logger = new Logger(RetentionPurgeService.name);

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  private addMonths(base: Date, months: number): Date {
    const d = new Date(base);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  /**
   * Finds records past their retention period and records them as PENDING
   * candidates for review. Never deletes anything. Returns the number of NEW
   * candidates created. Only STUDENT (anchor exitDate) and DATA_SUBJECT_REQUEST
   * (anchor resolvedAt) are wired.
   */
  async scan(organizationId: string): Promise<number> {
    const policies = await this.entityManager.find(RetentionPolicy, {
      where: { organizationId, isEnabled: true, isArchived: false },
    });

    let created = 0;
    for (const policy of policies) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - policy.retentionMonths);

      if (policy.entityType === RetentionEntityType.STUDENT) {
        const cutoffDate = cutoff.toISOString().slice(0, 10);
        const students = await this.entityManager.find(Student, {
          where: { organizationId, exitDate: LessThanOrEqual(cutoffDate) },
        });
        for (const s of students) {
          created += await this.upsertCandidate(
            organizationId,
            RetentionEntityType.STUDENT,
            s.id,
            `${s.firstName} ${s.lastName}`.trim(),
            this.addMonths(
              new Date(s.exitDate as string),
              policy.retentionMonths,
            ),
            policy.action,
          );
        }
      } else if (
        policy.entityType === RetentionEntityType.DATA_SUBJECT_REQUEST
      ) {
        const requests = await this.entityManager.find(DataSubjectRequest, {
          where: { organizationId, resolvedAt: LessThanOrEqual(cutoff) },
        });
        for (const r of requests) {
          created += await this.upsertCandidate(
            organizationId,
            RetentionEntityType.DATA_SUBJECT_REQUEST,
            r.id,
            r.subjectName,
            this.addMonths(r.resolvedAt as Date, policy.retentionMonths),
            policy.action,
          );
        }
      }
    }
    return created;
  }

  private async upsertCandidate(
    organizationId: string,
    entityType: RetentionEntityType,
    subjectId: string,
    subjectLabel: string,
    dueSince: Date,
    action: RetentionAction,
  ): Promise<number> {
    const existing = await this.entityManager.findOne(PurgeCandidate, {
      where: { organizationId, entityType, subjectId },
    });
    // Leave existing candidates (already pending/approved/reviewed/executed) alone.
    if (existing) return 0;

    await this.entityManager.save(
      PurgeCandidate,
      this.entityManager.create(PurgeCandidate, {
        organizationId,
        entityType,
        subjectId,
        subjectLabel: subjectLabel || '—',
        dueSince,
        action,
        status: PurgeStatus.PENDING,
      }),
    );
    return 1;
  }

  async listCandidates(
    organizationId: string,
    status?: PurgeStatus,
  ): Promise<PurgeCandidate[]> {
    return this.entityManager.find(PurgeCandidate, {
      where: { organizationId, ...(status ? { status } : {}) },
      order: { dueSince: 'ASC', createdAt: 'ASC' },
    });
  }

  async review(
    id: string,
    organizationId: string,
    approve: boolean,
    reviewerMembershipId: string | null,
  ): Promise<boolean> {
    const candidate = await this.entityManager.findOne(PurgeCandidate, {
      where: { id, organizationId },
    });
    if (!candidate) {
      throw new NotFoundException(`Purge candidate ${id} not found`);
    }
    if (candidate.status !== PurgeStatus.PENDING) {
      throw new ConflictException('Only pending candidates can be reviewed');
    }
    candidate.status = approve ? PurgeStatus.APPROVED : PurgeStatus.REJECTED;
    candidate.reviewedByMembershipId = reviewerMembershipId;
    candidate.reviewedAt = new Date();
    await this.entityManager.save(PurgeCandidate, candidate);
    return true;
  }

  /**
   * Executes an APPROVED candidate's action (DELETE / ANONYMIZE) in one
   * transaction. Rejects anything not APPROVED — deletion never happens without
   * a prior human approval.
   */
  async execute(id: string, organizationId: string): Promise<boolean> {
    return this.entityManager.transaction(async (tx) => {
      const candidate = await tx.findOne(PurgeCandidate, {
        where: { id, organizationId },
      });
      if (!candidate) {
        throw new NotFoundException(`Purge candidate ${id} not found`);
      }
      if (candidate.status !== PurgeStatus.APPROVED) {
        throw new ConflictException('Only approved candidates can be executed');
      }

      try {
        await this.applyAction(tx, candidate, organizationId);
        candidate.status = PurgeStatus.EXECUTED;
        candidate.executedAt = new Date();
      } catch (err) {
        candidate.status = PurgeStatus.FAILED;
        candidate.note = err instanceof Error ? err.message : String(err);
      }
      await tx.save(PurgeCandidate, candidate);
      return candidate.status === PurgeStatus.EXECUTED;
    });
  }

  private async applyAction(
    tx: EntityManager,
    candidate: PurgeCandidate,
    organizationId: string,
  ): Promise<void> {
    const { entityType, subjectId, action } = candidate;

    if (entityType === RetentionEntityType.STUDENT) {
      if (action === RetentionAction.DELETE) {
        await tx.delete(Consent, {
          subjectType: ConsentSubjectType.STUDENT,
          subjectId,
          organizationId,
        });
        await tx.delete(Student, { id: subjectId, organizationId });
      } else {
        await tx.update(
          Student,
          { id: subjectId, organizationId },
          {
            firstName: '[anonymisiert]',
            lastName: `[${subjectId.slice(0, 8)}]`,
            dateOfBirth: null,
            gender: null,
            notes: null,
          },
        );
      }
      return;
    }

    if (entityType === RetentionEntityType.DATA_SUBJECT_REQUEST) {
      if (action === RetentionAction.DELETE) {
        await tx.delete(DataSubjectRequest, { id: subjectId, organizationId });
      } else {
        await tx.update(
          DataSubjectRequest,
          { id: subjectId, organizationId },
          {
            subjectName: '[anonymisiert]',
            contactEmail: null,
            notes: null,
            resolutionNote: null,
          },
        );
      }
      return;
    }

    throw new Error(`Purge not supported for ${entityType}`);
  }

  /**
   * Opt-in nightly scan (env RETENTION_SCAN_ENABLED=true). Only populates the
   * review queue — execution always stays a manual, approved action.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async nightlyScan(): Promise<void> {
    if (process.env.RETENTION_SCAN_ENABLED !== 'true') return;
    const orgs = await this.entityManager.find(Organization, {
      select: { id: true },
    });
    for (const org of orgs) {
      try {
        const n = await this.scan(org.id);
        if (n)
          this.logger.log(`Retention scan: ${n} new candidates for ${org.id}`);
      } catch (err) {
        this.logger.error(
          `Retention scan failed for ${org.id}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }
}
