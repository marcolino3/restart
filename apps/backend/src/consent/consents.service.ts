import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Consent } from './entities/consent.entity';
import { ConsentAuditLog } from './entities/consent-audit-log.entity';
import { ConsentPurpose } from './entities/consent-purpose.entity';
import { RecordConsentInput } from './dto/record-consent.input';
import { WithdrawConsentInput } from './dto/withdraw-consent.input';
import { ConsentAuditAction } from './enums/consent-audit-action.enum';
import { ConsentStatus } from './enums/consent-status.enum';
import { ConsentSubjectType } from './enums/consent-subject-type.enum';

@Injectable()
export class ConsentsService {
  constructor(
    @InjectRepository(Consent)
    private readonly consentsRepo: Repository<Consent>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  /** All current consent decisions for one subject, with their purpose. */
  async findForSubject(
    subjectType: ConsentSubjectType,
    subjectId: string,
    organizationId: string,
  ): Promise<Consent[]> {
    return this.consentsRepo.find({
      where: { subjectType, subjectId, organizationId },
      relations: { purpose: true, grantedByContactPerson: true },
      order: { createdAt: 'ASC' },
    });
  }

  /** Append-only history for one subject (most recent first). */
  async findAuditTrail(
    subjectType: ConsentSubjectType,
    subjectId: string,
    organizationId: string,
  ): Promise<ConsentAuditLog[]> {
    return this.entityManager.find(ConsentAuditLog, {
      where: { subjectType, subjectId, organizationId },
      relations: { actorMembership: { user: true } },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Records (or overwrites) the current GRANTED/DENIED decision for a
   * purpose × subject and appends an immutable audit entry — one transaction.
   */
  async record(
    input: RecordConsentInput,
    organizationId: string,
    actorMembershipId: string | null,
  ): Promise<Consent> {
    return this.entityManager.transaction(async (m) => {
      const purpose = await m.findOne(ConsentPurpose, {
        where: { id: input.purposeId, organizationId },
      });
      if (!purpose) {
        throw new NotFoundException(
          `Consent purpose ${input.purposeId} not found`,
        );
      }
      if (!purpose.appliesTo.includes(input.subjectType)) {
        throw new BadRequestException(
          `Purpose "${purpose.slug}" does not apply to ${input.subjectType} subjects`,
        );
      }
      if (
        input.subjectType === ConsentSubjectType.STUDENT &&
        !input.grantedByContactPersonId
      ) {
        throw new BadRequestException(
          'grantedByContactPersonId is required for student consent (guardian)',
        );
      }
      if (
        purpose.requiresEvidence &&
        input.status === ConsentStatus.GRANTED &&
        !input.evidenceUrl
      ) {
        throw new BadRequestException(
          `Purpose "${purpose.slug}" requires a signed document to grant consent`,
        );
      }

      let consent = await m.findOne(Consent, {
        where: {
          organizationId,
          purposeId: input.purposeId,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
        },
      });
      const previousStatus = consent?.status ?? null;

      if (!consent) {
        consent = m.create(Consent, {
          organizationId,
          purposeId: input.purposeId,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
        });
      }

      consent.status = input.status;
      consent.grantedByContactPersonId = input.grantedByContactPersonId ?? null;
      consent.actorMembershipId = actorMembershipId;
      consent.decidedAt = input.decidedAt ?? new Date();
      consent.withdrawnAt = null;
      consent.evidenceUrl = input.evidenceUrl ?? null;
      consent.note = input.note ?? null;

      const saved = await m.save(Consent, consent);

      const action =
        previousStatus === null
          ? input.status === ConsentStatus.GRANTED
            ? ConsentAuditAction.GRANTED
            : ConsentAuditAction.DENIED
          : ConsentAuditAction.UPDATED;

      await m.save(
        ConsentAuditLog,
        m.create(ConsentAuditLog, {
          consentId: saved.id,
          purposeId: input.purposeId,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          action,
          previousStatus,
          newStatus: input.status,
          actorMembershipId,
          note: input.note ?? null,
          organizationId,
        }),
      );

      return saved;
    });
  }

  /** Revokes a previously granted consent (with proof in the audit trail). */
  async withdraw(
    input: WithdrawConsentInput,
    organizationId: string,
    actorMembershipId: string | null,
  ): Promise<Consent> {
    return this.entityManager.transaction(async (m) => {
      const consent = await m.findOne(Consent, {
        where: { id: input.id, organizationId },
      });
      if (!consent) {
        throw new NotFoundException(`Consent ${input.id} not found`);
      }
      if (consent.status !== ConsentStatus.GRANTED) {
        throw new ConflictException('Only a granted consent can be withdrawn');
      }

      const previousStatus = consent.status;
      consent.status = ConsentStatus.WITHDRAWN;
      consent.withdrawnAt = new Date();
      consent.actorMembershipId = actorMembershipId;
      if (input.note !== undefined) {
        consent.note = input.note ?? null;
      }

      const saved = await m.save(Consent, consent);

      await m.save(
        ConsentAuditLog,
        m.create(ConsentAuditLog, {
          consentId: saved.id,
          purposeId: consent.purposeId,
          subjectType: consent.subjectType,
          subjectId: consent.subjectId,
          action: ConsentAuditAction.WITHDRAWN,
          previousStatus,
          newStatus: ConsentStatus.WITHDRAWN,
          actorMembershipId,
          note: input.note ?? null,
          organizationId,
        }),
      );

      return saved;
    });
  }
}
