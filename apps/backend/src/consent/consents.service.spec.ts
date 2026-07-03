import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken, getRepositoryToken } from '@nestjs/typeorm';

import { ConsentsService } from './consents.service';
import { Consent } from './entities/consent.entity';
import { ConsentAuditLog } from './entities/consent-audit-log.entity';
import { ConsentAuditAction } from './enums/consent-audit-action.enum';
import { ConsentStatus } from './enums/consent-status.enum';
import { ConsentSubjectType } from './enums/consent-subject-type.enum';

const ORG_A = 'org-a';
const SUBJECT = 'subject-1';
const PURPOSE = 'purpose-1';

type MockManager = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

type AuditPayload = {
  action: ConsentAuditAction;
  previousStatus: ConsentStatus | null;
  newStatus: ConsentStatus;
  actorMembershipId: string | null;
  organizationId: string;
};

const purpose = (over: Record<string, unknown> = {}) => ({
  id: PURPOSE,
  slug: 'photo',
  appliesTo: [ConsentSubjectType.STUDENT, ConsentSubjectType.EMPLOYEE],
  requiresEvidence: false,
  organizationId: ORG_A,
  ...over,
});

describe('ConsentsService', () => {
  let service: ConsentsService;
  let repo: { find: jest.Mock };
  let manager: MockManager;
  let entityManager: { transaction: jest.Mock; find: jest.Mock };

  const auditPayload = (): AuditPayload | undefined => {
    const calls = manager.create.mock.calls as Array<[unknown, AuditPayload]>;
    return calls.find((c) => c[0] === ConsentAuditLog)?.[1];
  };

  beforeEach(async () => {
    repo = { find: jest.fn() };
    manager = {
      findOne: jest.fn(),
      create: jest.fn((_entity: unknown, v: Record<string, unknown>) => v),
      save: jest.fn((_entity: unknown, v: Record<string, unknown>) =>
        Promise.resolve({ id: 'saved-1', ...v }),
      ),
    };
    entityManager = {
      transaction: jest.fn((cb: (m: MockManager) => unknown) => cb(manager)),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentsService,
        { provide: getRepositoryToken(Consent), useValue: repo },
        { provide: getEntityManagerToken(), useValue: entityManager },
      ],
    }).compile();

    service = module.get(ConsentsService);
  });

  describe('findForSubject', () => {
    it('scopes the query to org + subject', async () => {
      repo.find.mockResolvedValue([]);
      await service.findForSubject(ConsentSubjectType.STUDENT, SUBJECT, ORG_A);
      expect(repo.find).toHaveBeenCalledWith({
        where: {
          subjectType: ConsentSubjectType.STUDENT,
          subjectId: SUBJECT,
          organizationId: ORG_A,
        },
        relations: { purpose: true, grantedByContactPerson: true },
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('record', () => {
    const baseInput = {
      subjectType: ConsentSubjectType.EMPLOYEE,
      subjectId: SUBJECT,
      purposeId: PURPOSE,
      status: ConsentStatus.GRANTED,
    };

    it('throws NotFound when the purpose is not in the org (multi-tenant)', async () => {
      manager.findOne.mockResolvedValueOnce(null); // purpose lookup
      await expect(
        service.record(baseInput, ORG_A, 'actor-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(manager.findOne).toHaveBeenCalledWith(expect.anything(), {
        where: { id: PURPOSE, organizationId: ORG_A },
      });
    });

    it('rejects when the purpose does not apply to the subject type', async () => {
      manager.findOne.mockResolvedValueOnce(
        purpose({ appliesTo: [ConsentSubjectType.STUDENT] }),
      );
      await expect(
        service.record(baseInput, ORG_A, 'actor-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('requires a guardian for student consent', async () => {
      manager.findOne.mockResolvedValueOnce(purpose());
      await expect(
        service.record(
          { ...baseInput, subjectType: ConsentSubjectType.STUDENT },
          ORG_A,
          'actor-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('requires evidence when the purpose demands it and status is GRANTED', async () => {
      manager.findOne.mockResolvedValueOnce(
        purpose({ requiresEvidence: true }),
      );
      await expect(
        service.record(baseInput, ORG_A, 'actor-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates the consent and a GRANTED audit entry', async () => {
      manager.findOne
        .mockResolvedValueOnce(purpose()) // purpose
        .mockResolvedValueOnce(null); // no existing consent

      const result = await service.record(baseInput, ORG_A, 'actor-1');

      expect(result.status).toBe(ConsentStatus.GRANTED);
      const audit = auditPayload();
      expect(audit?.action).toBe(ConsentAuditAction.GRANTED);
      expect(audit?.previousStatus).toBeNull();
      expect(audit?.newStatus).toBe(ConsentStatus.GRANTED);
      expect(audit?.actorMembershipId).toBe('actor-1');
      expect(audit?.organizationId).toBe(ORG_A);
    });

    it('logs UPDATED when overwriting an existing decision', async () => {
      manager.findOne
        .mockResolvedValueOnce(purpose()) // purpose
        .mockResolvedValueOnce({
          id: 'existing',
          status: ConsentStatus.DENIED,
          organizationId: ORG_A,
        }); // existing consent

      await service.record(baseInput, ORG_A, 'actor-1');

      const audit = auditPayload();
      expect(audit?.action).toBe(ConsentAuditAction.UPDATED);
      expect(audit?.previousStatus).toBe(ConsentStatus.DENIED);
    });
  });

  describe('withdraw', () => {
    it('throws NotFound for a foreign / missing consent', async () => {
      manager.findOne.mockResolvedValueOnce(null);
      await expect(
        service.withdraw({ id: 'c1' }, ORG_A, 'actor-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(manager.findOne).toHaveBeenCalledWith(expect.anything(), {
        where: { id: 'c1', organizationId: ORG_A },
      });
    });

    it('rejects withdrawing a non-granted consent', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 'c1',
        status: ConsentStatus.DENIED,
        organizationId: ORG_A,
      });
      await expect(
        service.withdraw({ id: 'c1' }, ORG_A, 'actor-1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('sets WITHDRAWN and appends a WITHDRAWN audit entry', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 'c1',
        status: ConsentStatus.GRANTED,
        purposeId: PURPOSE,
        subjectType: ConsentSubjectType.EMPLOYEE,
        subjectId: SUBJECT,
        organizationId: ORG_A,
      });

      const result = await service.withdraw(
        { id: 'c1', note: 'revoked by parent' },
        ORG_A,
        'actor-1',
      );

      expect(result.status).toBe(ConsentStatus.WITHDRAWN);
      expect(result.withdrawnAt).toBeInstanceOf(Date);
      const audit = auditPayload();
      expect(audit?.action).toBe(ConsentAuditAction.WITHDRAWN);
      expect(audit?.previousStatus).toBe(ConsentStatus.GRANTED);
      expect(audit?.newStatus).toBe(ConsentStatus.WITHDRAWN);
    });
  });
});
