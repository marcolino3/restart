import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { RetentionPurgeService } from './retention-purge.service';
import { PurgeStatus } from './enums/purge-status.enum';
import { RetentionPolicy } from '@/retention/entities/retention-policy.entity';
import { RetentionAction } from '@/retention/enums/retention-action.enum';
import { RetentionEntityType } from '@/retention/enums/retention-entity-type.enum';
import { Student } from '@/school-management/students/entities/student.entity';
import { DataSubjectRequest } from '@/data-requests/entities/data-subject-request.entity';

const ORG_A = 'org-a';

type Tx = {
  findOne: jest.Mock;
  delete: jest.Mock;
  update: jest.Mock;
  save: jest.Mock;
};

describe('RetentionPurgeService', () => {
  let service: RetentionPurgeService;
  let manager: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    transaction: jest.Mock;
  };
  let tx: Tx;

  beforeEach(async () => {
    tx = {
      findOne: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      save: jest.fn((_e: unknown, v: unknown) => Promise.resolve(v)),
    };
    manager = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((_e: unknown, v: Record<string, unknown>) => v),
      save: jest.fn((_e: unknown, v: unknown) => Promise.resolve(v)),
      transaction: jest.fn((cb: (t: Tx) => unknown) => cb(tx)),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetentionPurgeService,
        { provide: getEntityManagerToken(), useValue: manager },
      ],
    }).compile();

    service = module.get(RetentionPurgeService);
  });

  describe('scan', () => {
    it('creates a PENDING candidate for a due student', async () => {
      manager.find.mockImplementation((entity: unknown) => {
        if (entity === RetentionPolicy)
          return Promise.resolve([
            {
              entityType: RetentionEntityType.STUDENT,
              retentionMonths: 36,
              action: RetentionAction.ANONYMIZE,
            },
          ]);
        if (entity === Student)
          return Promise.resolve([
            {
              id: 's1',
              firstName: 'Kim',
              lastName: 'Muster',
              exitDate: '2019-01-01',
            },
          ]);
        return Promise.resolve([]);
      });
      manager.findOne.mockResolvedValue(null); // no existing candidate

      const created = await service.scan(ORG_A);

      expect(created).toBe(1);
      const saved = manager.save.mock.calls[0][1] as Record<string, unknown>;
      expect(saved).toMatchObject({
        organizationId: ORG_A,
        entityType: RetentionEntityType.STUDENT,
        subjectId: 's1',
        status: PurgeStatus.PENDING,
        action: RetentionAction.ANONYMIZE,
      });
    });

    it('does not duplicate an existing candidate', async () => {
      manager.find.mockImplementation((entity: unknown) => {
        if (entity === RetentionPolicy)
          return Promise.resolve([
            {
              entityType: RetentionEntityType.STUDENT,
              retentionMonths: 12,
              action: RetentionAction.DELETE,
            },
          ]);
        if (entity === Student)
          return Promise.resolve([
            { id: 's1', firstName: 'A', lastName: 'B', exitDate: '2019-01-01' },
          ]);
        return Promise.resolve([]);
      });
      manager.findOne.mockResolvedValue({ id: 'existing' });

      expect(await service.scan(ORG_A)).toBe(0);
      expect(manager.save).not.toHaveBeenCalled();
    });
  });

  describe('review', () => {
    it('approves a pending candidate', async () => {
      manager.findOne.mockResolvedValue({
        id: 'c1',
        status: PurgeStatus.PENDING,
        organizationId: ORG_A,
      });
      const ok = await service.review('c1', ORG_A, true, 'rev-1');
      expect(ok).toBe(true);
      const saved = manager.save.mock.calls[0][1] as { status: PurgeStatus };
      expect(saved.status).toBe(PurgeStatus.APPROVED);
    });

    it('rejects reviewing a non-pending candidate', async () => {
      manager.findOne.mockResolvedValue({
        id: 'c1',
        status: PurgeStatus.EXECUTED,
        organizationId: ORG_A,
      });
      await expect(
        service.review('c1', ORG_A, true, 'rev-1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('execute', () => {
    it('refuses to execute a candidate that is not approved', async () => {
      tx.findOne.mockResolvedValue({
        id: 'c1',
        status: PurgeStatus.PENDING,
        organizationId: ORG_A,
      });
      await expect(service.execute('c1', ORG_A)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tx.delete).not.toHaveBeenCalled();
      expect(tx.update).not.toHaveBeenCalled();
    });

    it('anonymizes an approved student candidate', async () => {
      tx.findOne.mockResolvedValue({
        id: 'c1',
        status: PurgeStatus.APPROVED,
        entityType: RetentionEntityType.STUDENT,
        action: RetentionAction.ANONYMIZE,
        subjectId: 's1',
        organizationId: ORG_A,
      });

      const ok = await service.execute('c1', ORG_A);

      expect(ok).toBe(true);
      expect(tx.update).toHaveBeenCalledWith(
        Student,
        { id: 's1', organizationId: ORG_A },
        expect.objectContaining({ firstName: '[anonymisiert]', notes: null }),
      );
      const saved = tx.save.mock.calls[0][1] as { status: PurgeStatus };
      expect(saved.status).toBe(PurgeStatus.EXECUTED);
    });

    it('deletes an approved data-subject-request candidate', async () => {
      tx.findOne.mockResolvedValue({
        id: 'c2',
        status: PurgeStatus.APPROVED,
        entityType: RetentionEntityType.DATA_SUBJECT_REQUEST,
        action: RetentionAction.DELETE,
        subjectId: 'r1',
        organizationId: ORG_A,
      });

      const ok = await service.execute('c2', ORG_A);

      expect(ok).toBe(true);
      expect(tx.delete).toHaveBeenCalledWith(DataSubjectRequest, {
        id: 'r1',
        organizationId: ORG_A,
      });
    });
  });
});
