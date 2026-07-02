import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EmployeeAbsencesService } from './employee-absences.service';
import { GoogleCalendarService } from '@/google/google-calendar.service';
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
    transaction: jest.Mock;
  };
  let periods: { assertRangeUnlocked: jest.Mock };
  let access: { assertCanManageEmployee: jest.Mock };
  let recompute: { recomputeRange: jest.Mock };

  beforeEach(async () => {
    entityManager = { findOne: jest.fn(), transaction: jest.fn() };
    periods = { assertRangeUnlocked: jest.fn().mockResolvedValue(undefined) };
    access = {
      assertCanManageEmployee: jest.fn().mockResolvedValue(undefined),
    };
    recompute = { recomputeRange: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAbsencesService,
        { provide: EntityManager, useValue: entityManager },
        { provide: GoogleCalendarService, useValue: {} },
        { provide: BalanceRecomputeService, useValue: recompute },
        { provide: TimeTrackingAccessService, useValue: access },
        { provide: TimeTrackingPeriodsService, useValue: periods },
      ],
    }).compile();

    service = module.get<EmployeeAbsencesService>(EmployeeAbsencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      expect(access.assertCanManageEmployee).toHaveBeenCalledWith(
        user,
        'emp-9',
      );
      expect(recompute.recomputeRange).toHaveBeenCalledWith(
        'org-1',
        'emp-9',
        '2026-01-05',
        '2026-01-06',
      );
    });
  });

  describe('updateEmployeeAbsence', () => {
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
  });
});
