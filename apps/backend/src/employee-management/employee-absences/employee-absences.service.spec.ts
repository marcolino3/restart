import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EmployeeAbsencesService } from './employee-absences.service';
import { AbsenceCalendarSyncService } from './absence-calendar-sync.service';
import { AbsenceRequestNotificationService } from './absence-request-notification.service';
import { EmployeeAbsenceStatus } from './entities/employee-absence-status.enum';
import { CreateEmployeeAbsenceNoticeInput } from './dto/create-employee-absence-notice.input';
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
    save: jest.Mock;
  };
  let periods: { assertRangeUnlocked: jest.Mock };
  let access: {
    assertCanManageAbsence: jest.Mock;
    assertCanViewEmployee: jest.Mock;
  };
  let recompute: { recomputeRange: jest.Mock };
  let storage: { delete: jest.Mock };
  let notifications: { notifyRequested: jest.Mock; notifyDecided: jest.Mock };
  let calendarSync: { sync: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    entityManager = {
      findOne: jest.fn(),
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      transaction: jest.fn(),
      save: jest.fn().mockImplementation((_e, v) => Promise.resolve(v)),
    };
    periods = { assertRangeUnlocked: jest.fn().mockResolvedValue(undefined) };
    access = {
      assertCanManageAbsence: jest.fn().mockResolvedValue(undefined),
      assertCanViewEmployee: jest.fn().mockResolvedValue(undefined),
    };
    recompute = { recomputeRange: jest.fn().mockResolvedValue(undefined) };
    storage = { delete: jest.fn().mockResolvedValue(undefined) };
    notifications = {
      notifyRequested: jest.fn().mockResolvedValue(undefined),
      notifyDecided: jest.fn().mockResolvedValue(undefined),
    };
    calendarSync = {
      sync: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAbsencesService,
        { provide: EntityManager, useValue: entityManager },
        { provide: AbsenceCalendarSyncService, useValue: calendarSync },
        { provide: AbsenceRequestNotificationService, useValue: notifications },
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

    it('liefert nichts, wenn die Membership nicht zur aktiven Org gehört', async () => {
      // Fremd-Org: die org-gefilterte Suche findet die Membership nicht — es
      // darf keine einzige Absenz geladen werden.
      entityManager.findOne.mockResolvedValue(null);

      await expect(
        service.findAllForCaller({
          orgId: 'org-foreign',
          membershipId: 'mem-1',
        } as unknown as TokenPayload),
      ).resolves.toEqual([]);
      expect(entityManager.find).not.toHaveBeenCalled();
    });

    it('liefert eine leere Liste, wenn die Membership keinen Mitarbeiter hat', async () => {
      entityManager.findOne.mockResolvedValue({
        id: 'mem-1',
        organizationId: 'org-1',
        employee: null,
      });

      await expect(service.findAllForCaller(user)).resolves.toEqual([]);
      expect(entityManager.find).not.toHaveBeenCalled();
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
        status: EmployeeAbsenceStatus.APPROVED,
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
            delete: jest.fn(),
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
        status: EmployeeAbsenceStatus.APPROVED,
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

  describe('approval workflow', () => {
    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const plusDays = (n: number) =>
      iso(new Date(today.getTime() + n * 86_400_000));

    function mockNoticeContext(
      requiresApproval: boolean,
      category: Record<string, unknown> = {},
    ) {
      entityManager.findOne
        .mockResolvedValueOnce({
          id: 'mem-1',
          employee: { id: 'emp-1' },
          user: { firstName: 'Anna', lastName: 'Test' },
        })
        .mockResolvedValueOnce({
          id: 'cat-1',
          systemCode: 'VACATION',
          requiresApproval,
          ...category,
        });
      const tx = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce({ id: 'org-1' })
          .mockResolvedValueOnce({
            id: 'cat-1',
            systemCode: 'VACATION',
            ...category,
          }),
        createQueryBuilder: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        }),
        create: jest.fn().mockImplementation((_e, v) => v),
        save: jest
          .fn()
          .mockImplementation((v) => Promise.resolve({ ...v, id: 'abs-new' })),
        delete: jest.fn(),
      };
      entityManager.transaction.mockImplementation(
        async (fn: (m: unknown) => Promise<unknown>) => fn(tx),
      );
      return tx;
    }

    it('lehnt Mitteilungs-Kategorie übermorgen ab', async () => {
      mockNoticeContext(false);
      await expect(
        service.createEmployeeAbsenceNotice(
          {
            absenceCategoryId: 'cat-1',
            startDate: plusDays(2),
          } as CreateEmployeeAbsenceNoticeInput,
          user,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(entityManager.transaction).not.toHaveBeenCalled();
    });

    it('Antrags-Kategorie wird PENDING ohne Days/Recompute, Mail an Vorgesetzte', async () => {
      const tx = mockNoticeContext(true);
      const result = await service.createEmployeeAbsenceNotice(
        {
          absenceCategoryId: 'cat-1',
          startDate: plusDays(30),
        } as CreateEmployeeAbsenceNoticeInput,
        user,
      );
      expect(result.status).toBe(EmployeeAbsenceStatus.PENDING);
      expect(tx.delete).not.toHaveBeenCalled();
      expect(recompute.recomputeRange).not.toHaveBeenCalled();
      expect(calendarSync.sync).not.toHaveBeenCalled();
      expect(notifications.notifyRequested).toHaveBeenCalledTimes(1);
    });

    it('TIME-Kategorie verlangt Von/Bis', async () => {
      mockNoticeContext(false, { entryPrecision: 'TIME' });
      await expect(
        service.createEmployeeAbsenceNotice(
          {
            absenceCategoryId: 'cat-1',
            startDate: plusDays(1),
          } as CreateEmployeeAbsenceNoticeInput,
          user,
        ),
      ).rejects.toThrow('requires a start and end time');
    });

    it('TIME-Kategorie speichert Zeiten und abgeleiteten Grad', async () => {
      const tx = mockNoticeContext(false, {
        entryPrecision: 'TIME',
        defaultPercentage: 100,
      });
      await service.createEmployeeAbsenceNotice(
        {
          absenceCategoryId: 'cat-1',
          startDate: plusDays(1),
          startTime: '14:00',
          endTime: '15:30',
        } as CreateEmployeeAbsenceNoticeInput,
        user,
      );
      const created = tx.create.mock.calls[0][1] as Record<string, unknown>;
      expect(created.startTime).toBe('14:00');
      expect(created.endTime).toBe('15:30');
      expect(created.percentage).toBe(18);
      expect(calendarSync.sync).toHaveBeenCalledWith(
        expect.objectContaining({ startTime: '14:00', endTime: '15:30' }),
      );
    });

    it('DAY-Kategorie lehnt Halbtag und Zeiten ab', async () => {
      mockNoticeContext(false, { entryPrecision: 'DAY' });
      await expect(
        service.createEmployeeAbsenceNotice(
          {
            absenceCategoryId: 'cat-1',
            startDate: plusDays(1),
            dayPart: 'AFTERNOON',
          } as CreateEmployeeAbsenceNoticeInput,
          user,
        ),
      ).rejects.toThrow('only allows whole days');
    });

    it('HALF_DAY-Kategorie: Nachmittag ergibt 50 %', async () => {
      const tx = mockNoticeContext(false, {
        entryPrecision: 'HALF_DAY',
        defaultPercentage: 100,
      });
      await service.createEmployeeAbsenceNotice(
        {
          absenceCategoryId: 'cat-1',
          startDate: plusDays(1),
          dayPart: 'AFTERNOON',
        } as CreateEmployeeAbsenceNoticeInput,
        user,
      );
      const created = tx.create.mock.calls[0][1] as Record<string, unknown>;
      expect(created.dayPart).toBe('AFTERNOON');
      expect(created.percentage).toBe(50);
    });

    it('Kategorie ohne Kalender-Sync ruft den Sync nicht auf', async () => {
      mockNoticeContext(false, { syncToCalendar: false });
      await service.createEmployeeAbsenceNotice(
        {
          absenceCategoryId: 'cat-1',
          startDate: plusDays(1),
        } as CreateEmployeeAbsenceNoticeInput,
        user,
      );
      expect(calendarSync.sync).not.toHaveBeenCalled();
    });

    it('Titel-Template der Kategorie geht an den Kalender-Sync', async () => {
      mockNoticeContext(false, { calendarTitleTemplate: '{lastName} krank' });
      await service.createEmployeeAbsenceNotice(
        {
          absenceCategoryId: 'cat-1',
          startDate: plusDays(1),
        } as CreateEmployeeAbsenceNoticeInput,
        user,
      );
      expect(calendarSync.sync).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeName: 'Anna Test',
          titleTemplate: '{lastName} krank',
        }),
      );
    });

    it('Mitteilungs-Kategorie morgen wird sofort APPROVED mit Recompute', async () => {
      mockNoticeContext(false);
      const result = await service.createEmployeeAbsenceNotice(
        {
          absenceCategoryId: 'cat-1',
          startDate: plusDays(1),
        } as CreateEmployeeAbsenceNoticeInput,
        user,
      );
      expect(result.status).toBe(EmployeeAbsenceStatus.APPROVED);
      expect(recompute.recomputeRange).toHaveBeenCalledTimes(1);
      expect(notifications.notifyRequested).not.toHaveBeenCalled();
    });

    function mockPending(employeeId = 'emp-9') {
      const absence = {
        id: 'abs-1',
        organizationId: 'org-1',
        employeeId,
        membershipId: 'mem-9',
        status: EmployeeAbsenceStatus.PENDING,
        startDate: new Date('2026-05-04'),
        endDate: new Date('2026-05-06'),
        absenceCategory: { systemCode: 'VACATION', syncToCalendar: true },
      };
      entityManager.findOne
        .mockResolvedValueOnce(absence)
        .mockResolvedValueOnce({
          id: 'mem-1',
          employeeId: 'emp-1',
          user: { firstName: 'Lead', lastName: 'One' },
        })
        .mockResolvedValueOnce({
          id: 'mem-9',
          user: { firstName: 'Anna', lastName: 'Test' },
        });
      const tx = {
        create: jest.fn().mockImplementation((_e, v) => v),
        save: jest.fn().mockImplementation((_e, v) => Promise.resolve(v)),
        delete: jest.fn(),
      };
      entityManager.transaction.mockImplementation(
        async (fn: (m: unknown) => Promise<unknown>) => fn(tx),
      );
      return { absence, tx };
    }

    it('approve setzt APPROVED, schreibt Days, recomputed und mailt', async () => {
      const { tx } = mockPending();
      const result = await service.approveEmployeeAbsence('abs-1', null, user);
      expect(access.assertCanManageAbsence).toHaveBeenCalledWith(user, 'emp-9');
      expect(result.status).toBe(EmployeeAbsenceStatus.APPROVED);
      expect(result.decidedByMembershipId).toBe('mem-1');
      expect(tx.delete).toHaveBeenCalled();
      expect(tx.save).toHaveBeenCalledTimes(2);
      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        'org-1',
        'emp-9',
        '2026-05-04',
        '2026-05-06',
      );
      expect(calendarSync.sync).toHaveBeenCalledTimes(1);
      expect(notifications.notifyDecided).toHaveBeenCalledWith(
        expect.objectContaining({ approved: true, employeeId: 'emp-9' }),
      );
    });

    it('reject ohne Begründung -> 400', async () => {
      await expect(
        service.rejectEmployeeAbsence('abs-1', '  ', user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(entityManager.findOne).not.toHaveBeenCalled();
    });

    it('reject setzt REJECTED ohne Days/Recompute', async () => {
      const { tx } = mockPending();
      const result = await service.rejectEmployeeAbsence('abs-1', 'Nein', user);
      expect(result.status).toBe(EmployeeAbsenceStatus.REJECTED);
      expect(result.decisionNote).toBe('Nein');
      expect(tx.delete).not.toHaveBeenCalled();
      expect(recompute.recomputeRange).not.toHaveBeenCalled();
      expect(notifications.notifyDecided).toHaveBeenCalledWith(
        expect.objectContaining({ approved: false, decisionNote: 'Nein' }),
      );
    });

    it('Lead darf eigenen Antrag nicht genehmigen -> 403', async () => {
      mockPending('emp-1');
      await expect(
        service.approveEmployeeAbsence('abs-1', null, {
          ...user,
          roles: ['TEAM_LEAD'],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(recompute.recomputeRange).not.toHaveBeenCalled();
    });

    it('HR darf eigenen Antrag genehmigen', async () => {
      mockPending('emp-1');
      const result = await service.approveEmployeeAbsence('abs-1', null, {
        ...user,
        roles: ['HR_MANAGER'],
      });
      expect(result.status).toBe(EmployeeAbsenceStatus.APPROVED);
    });

    it('nur PENDING kann entschieden werden', async () => {
      entityManager.findOne.mockResolvedValueOnce({
        id: 'abs-1',
        employeeId: 'emp-9',
        status: EmployeeAbsenceStatus.APPROVED,
      });
      await expect(
        service.approveEmployeeAbsence('abs-1', null, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('withdraw nur eigener PENDING-Antrag', async () => {
      entityManager.findOne.mockResolvedValueOnce({
        id: 'abs-1',
        status: EmployeeAbsenceStatus.PENDING,
        isActive: true,
      });
      await expect(
        service.withdrawMyAbsenceRequest('abs-1', user),
      ).resolves.toBe(true);
      expect(entityManager.findOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            membershipId: 'mem-1',
          }),
        }),
      );
      expect(entityManager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ isActive: false }),
      );

      entityManager.findOne.mockResolvedValueOnce({
        id: 'abs-2',
        status: EmployeeAbsenceStatus.APPROVED,
        isActive: true,
      });
      await expect(
        service.withdrawMyAbsenceRequest('abs-2', user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
