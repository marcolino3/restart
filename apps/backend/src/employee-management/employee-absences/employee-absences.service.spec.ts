import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EmployeeAbsencesService } from './employee-absences.service';
import { AbsenceCalendarSyncService } from './absence-calendar-sync.service';
import { StorageService } from '@/storage/storage.service';
import { BalanceRecomputeService } from '../work-time-calculation/balance-recompute.service';
import { TimeTrackingAccessService } from '../work-time-calculation/time-tracking-access.service';
import { TimeTrackingPeriodsService } from '../time-tracking-periods/time-tracking-periods.service';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';

const user = {
  orgId: 'org-1',
  membershipId: 'mem-1',
} as unknown as TokenPayload;

describe('EmployeeAbsencesService', () => {
  let service: EmployeeAbsencesService;
  let entityManager: {
    findOne: jest.Mock;
    find: jest.Mock;
    findOneOrFail: jest.Mock;
    transaction: jest.Mock;
  };
  let periods: { assertRangeUnlocked: jest.Mock };
  let access: {
    assertCanManageAbsence: jest.Mock;
    assertCanViewEmployee: jest.Mock;
  };
  let recompute: { recomputeRange: jest.Mock };
  let storage: { delete: jest.Mock };

  beforeEach(async () => {
    entityManager = {
      findOne: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      transaction: jest.fn(),
    };
    periods = { assertRangeUnlocked: jest.fn().mockResolvedValue(undefined) };
    access = {
      assertCanManageAbsence: jest.fn().mockResolvedValue(undefined),
      assertCanViewEmployee: jest.fn().mockResolvedValue(undefined),
    };
    recompute = { recomputeRange: jest.fn().mockResolvedValue(undefined) };
    storage = { delete: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAbsencesService,
        { provide: EntityManager, useValue: entityManager },
        {
          provide: AbsenceCalendarSyncService,
          useValue: {
            sync: jest.fn().mockResolvedValue(undefined),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: BalanceRecomputeService, useValue: recompute },
        { provide: TimeTrackingAccessService, useValue: access },
        { provide: TimeTrackingPeriodsService, useValue: periods },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get<EmployeeAbsencesService>(EmployeeAbsencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByEmployeeId', () => {
    it('prüft Leserecht und filtert nach Org + Mitarbeiter', async () => {
      entityManager.find.mockResolvedValue([]);
      await service.findAllByEmployeeId('emp-1', user);
      expect(access.assertCanViewEmployee).toHaveBeenCalledWith(user, 'emp-1');
      expect(entityManager.find).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            employeeId: 'emp-1',
            isActive: true,
          }),
        }),
      );
    });
  });

  describe('findAllForCaller', () => {
    it('löst den Mitarbeiter aus dem Token auf, org-gefiltert', async () => {
      entityManager.findOne.mockResolvedValue({
        id: 'mem-1',
        organizationId: 'org-1',
        employee: { id: 'emp-1' },
      });
      entityManager.find.mockResolvedValue([]);

      await service.findAllForCaller(user);

      expect(entityManager.findOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: { id: 'mem-1', organizationId: 'org-1' },
        }),
      );
      expect(entityManager.find).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            employeeId: 'emp-1',
            isActive: true,
          }),
        }),
      );
    });

    it('nutzt niemals eine Employee-ID aus dem Aufruf', async () => {
      // Selbstbedienung: die Employee-ID stammt ausschliesslich aus der
      // Membership des Tokens, es gibt kein Argument, über das ein Aufrufer
      // fremde Absenzen anfordern könnte.
      entityManager.findOne.mockResolvedValue({
        id: 'mem-1',
        organizationId: 'org-1',
        employee: { id: 'emp-own' },
      });
      entityManager.find.mockResolvedValue([]);

      await service.findAllForCaller({
        ...user,
        employeeId: 'emp-foreign',
      } as unknown as TokenPayload);

      const findArgs = entityManager.find.mock.calls[0][1] as {
        where: { employeeId: string };
      };
      expect(findArgs.where.employeeId).toBe('emp-own');
    });

    it('wirft 404, wenn die Membership nicht zur aktiven Org gehört', async () => {
      // Fremd-Org: die org-gefilterte Suche findet die Membership nicht.
      entityManager.findOne.mockResolvedValue(null);

      await expect(
        service.findAllForCaller({
          orgId: 'org-foreign',
          membershipId: 'mem-1',
        } as unknown as TokenPayload),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(entityManager.find).not.toHaveBeenCalled();
    });

    it('wirft 404, wenn die Membership keinen Mitarbeiter hat', async () => {
      entityManager.findOne.mockResolvedValue({
        id: 'mem-1',
        organizationId: 'org-1',
        employee: null,
      });

      await expect(service.findAllForCaller(user)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('deleteEmployeeAbsence', () => {
    it('wirft 404 für Absenzen fremder Organisationen', async () => {
      entityManager.findOne.mockResolvedValue(null);
      await expect(
        service.deleteEmployeeAbsence('abs-1', user),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(entityManager.findOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org-1' }),
        }),
      );
    });

    it('blockiert Löschen in gesperrter Periode', async () => {
      entityManager.findOne.mockResolvedValue({
        id: 'abs-1',
        employeeId: 'emp-1',
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-01-06'),
      });
      periods.assertRangeUnlocked.mockRejectedValue(
        new BadRequestException('gesperrt'),
      );
      await expect(
        service.deleteEmployeeAbsence('abs-1', user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(recompute.recomputeRange).not.toHaveBeenCalled();
    });

    it('prüft Schreibrecht auf den Ziel-Mitarbeiter', async () => {
      entityManager.findOne.mockResolvedValue({
        id: 'abs-1',
        employeeId: 'emp-9',
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-01-06'),
      });
      entityManager.transaction.mockImplementation(
        async (fn: (m: unknown) => Promise<unknown>) =>
          fn({
            save: jest.fn(),
            delete: jest.fn(),
          }),
      );
      await service.deleteEmployeeAbsence('abs-1', user);
      expect(access.assertCanManageAbsence).toHaveBeenCalledWith(user, 'emp-9');
      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        'org-1',
        'emp-9',
        '2026-01-05',
        '2026-01-06',
      );
    });
  });

  describe('createEmployeeAbsence', () => {
    it('speichert Arztzeugnisse und weitere Dokumente mit Bezeichnung', async () => {
      const employee = {
        id: 'emp-1',
        membership: {
          id: 'mem-1',
          user: { firstName: 'Anna', lastName: 'Test' },
        },
      };
      entityManager.findOne.mockResolvedValueOnce(employee);

      const certificates = [
        { url: '/api/absence-certificates/a.pdf', label: 'Erstattung' },
      ];
      const additionalDocuments = [
        { url: '/api/absence-certificates/b.pdf', label: 'Unfallmeldung' },
      ];

      let savedAbsence: Record<string, unknown> | undefined;
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      entityManager.transaction.mockImplementation(
        async (fn: (m: unknown) => Promise<unknown>) =>
          fn({
            findOne: jest
              .fn()
              .mockResolvedValueOnce({ id: 'org-1' })
              .mockResolvedValueOnce({ id: 'cat-1', systemCode: 'SICKNESS' }),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
            create: jest.fn().mockImplementation((_e, v) => v),
            save: jest.fn().mockImplementation((v) => {
              if (v && typeof v === 'object' && 'certificates' in v) {
                savedAbsence = v as Record<string, unknown>;
              }
              return { ...v, id: 'abs-new', employeeId: 'emp-1' };
            }),
          }),
      );

      await service.createEmployeeAbsence(
        {
          employeeId: 'emp-1',
          absenceCategoryId: 'cat-1',
          startDate: '2026-03-01',
          endDate: '2026-03-03',
          note: 'Krank',
          isTeamInformed: true,
          certificates,
          additionalDocuments,
        },
        user,
      );

      expect(access.assertCanManageAbsence).toHaveBeenCalledWith(user, 'emp-1');
      expect(savedAbsence?.certificates).toEqual(certificates);
      expect(savedAbsence?.additionalDocuments).toEqual(additionalDocuments);
      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        'org-1',
        'emp-1',
        '2026-03-01',
        '2026-03-03',
      );
    });
  });

  describe('updateEmployeeAbsence', () => {
    it('aktualisiert Dokument-Arrays', async () => {
      const absence = {
        id: 'abs-1',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        absenceCategoryId: 'cat-1',
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-01-06'),
        certificates: [],
        additionalDocuments: [],
      };
      entityManager.findOne.mockResolvedValue(absence);
      entityManager.transaction.mockImplementation(
        async (fn: (m: unknown) => Promise<unknown>) =>
          fn({
            save: jest.fn().mockImplementation((_e, v) => v ?? absence),
            delete: jest.fn(),
            create: jest.fn().mockImplementation((_e, v) => v),
          }),
      );

      const certificates = [
        { url: '/api/absence-certificates/c.pdf', label: 'Folgezeugnis' },
      ];
      const updated = await service.updateEmployeeAbsence(
        { id: 'abs-1', certificates },
        user,
      );

      expect(updated.certificates).toEqual(certificates);
    });

    it('rechnet die Union aus altem und neuem Bereich neu', async () => {
      const absence = {
        id: 'abs-1',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        absenceCategoryId: 'cat-1',
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-01-06'),
      };
      entityManager.findOne.mockResolvedValue(absence);
      entityManager.transaction.mockImplementation(
        async (fn: (m: unknown) => Promise<unknown>) =>
          fn({
            save: jest.fn().mockImplementation((_e, v) => v ?? absence),
            delete: jest.fn(),
            create: jest.fn().mockImplementation((_e, v) => v),
          }),
      );
      await service.updateEmployeeAbsence(
        { id: 'abs-1', startDate: '2026-01-07', endDate: '2026-01-08' },
        user,
      );
      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        'org-1',
        'emp-1',
        '2026-01-05',
        '2026-01-08',
      );
    });

    it('löscht entfernte Dokumente aus dem Storage', async () => {
      const absence = {
        id: 'abs-1',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        absenceCategoryId: 'cat-1',
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-01-06'),
        certificates: [
          { url: '/api/absence-certificates/old.pdf', label: 'Alt' },
        ],
        additionalDocuments: [],
      };
      entityManager.findOne.mockResolvedValue(absence);
      entityManager.transaction.mockImplementation(
        async (fn: (m: unknown) => Promise<unknown>) =>
          fn({
            save: jest.fn().mockImplementation((_e, v) => v ?? absence),
            delete: jest.fn(),
            create: jest.fn().mockImplementation((_e, v) => v),
          }),
      );

      await service.updateEmployeeAbsence(
        {
          id: 'abs-1',
          certificates: [
            { url: '/api/absence-certificates/new.pdf', label: 'Neu' },
          ],
        },
        user,
      );

      expect(storage.delete).toHaveBeenCalledWith(
        'absence-certificates/org-1/old.pdf',
      );
    });

    it('lehnt externe Dokument-URLs ab', async () => {
      const absence = {
        id: 'abs-1',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        absenceCategoryId: 'cat-1',
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-01-06'),
        certificates: [],
        additionalDocuments: [],
      };
      entityManager.findOne.mockResolvedValue(absence);

      await expect(
        service.updateEmployeeAbsence(
          {
            id: 'abs-1',
            certificates: [{ url: 'https://evil.example/x.pdf', label: 'bad' }],
          },
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('deleteEmployeeAbsence', () => {
    it('räumt Storage-Dokumente beim Soft-Delete auf', async () => {
      const absence = {
        id: 'abs-1',
        employeeId: 'emp-1',
        organizationId: 'org-1',
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-01-06'),
        certificates: [
          { url: '/api/absence-certificates/c.pdf', label: 'Zeugnis' },
        ],
        additionalDocuments: [
          { url: '/api/absence-certificates/d.pdf', label: 'Unfall' },
        ],
      };
      entityManager.findOne.mockResolvedValue(absence);
      entityManager.transaction.mockImplementation(
        async (fn: (m: unknown) => Promise<unknown>) =>
          fn({
            save: jest.fn().mockResolvedValue(absence),
            delete: jest.fn(),
          }),
      );

      await service.deleteEmployeeAbsence('abs-1', user);

      expect(storage.delete).toHaveBeenCalledWith(
        'absence-certificates/org-1/c.pdf',
      );
      expect(storage.delete).toHaveBeenCalledWith(
        'absence-certificates/org-1/d.pdf',
      );
    });
  });
});
