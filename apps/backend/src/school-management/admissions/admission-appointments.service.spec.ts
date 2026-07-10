import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { AdmissionAppointmentType } from '@/school-management/admission-appointment-types/entities/admission-appointment-type.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { AdmissionAppointmentsService } from './admission-appointments.service';
import { AdmissionActivity } from './entities/admission-activity.entity';
import { AdmissionAppointmentAssignee } from './entities/admission-appointment-assignee.entity';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionAppointment } from './entities/admission-appointment.entity';
import { AdmissionActivityType } from './enums/admission-activity-type.enum';

const ORG_ID = 'org-1';

const createMockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  findOneOrFail: jest.fn((opts: { where?: { id?: string } }) =>
    Promise.resolve({ id: opts?.where?.id ?? 'apt-mock' }),
  ),
  create: jest.fn((d: unknown) => d),
  // Ensure a saved entity always carries an id so create()'s post-save reload
  // has something to look up.
  save: jest.fn((d: Record<string, unknown>) =>
    Promise.resolve({ id: 'apt-1', ...d }),
  ),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
});

// Routes the transaction manager to per-entity mock repos so tests can assert
// which appointment / activity / assignee rows were written.
function makeDataSource(
  capture: {
    assignees: Array<Record<string, unknown>>;
    activities: Array<Record<string, unknown>>;
  },
  appointmentRepo: ReturnType<typeof createMockRepository>,
  typesRepo: ReturnType<typeof createMockRepository>,
) {
  const assigneeRepo = {
    create: (d: Record<string, unknown>) => d,
    save: (rows: Array<Record<string, unknown>>) => {
      const list = Array.isArray(rows) ? rows : [rows];
      capture.assignees.push(...list);
      return Promise.resolve(rows);
    },
    delete: () => Promise.resolve({ affected: 0 }),
  };
  let activitySeq = 0;
  const activityRepo = {
    create: (d: Record<string, unknown>) => d,
    findOne: jest.fn().mockResolvedValue(null),
    save: (row: Record<string, unknown>) => {
      const saved = { id: `act-${++activitySeq}`, ...row };
      capture.activities.push(saved);
      return Promise.resolve(saved);
    },
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const manager = {
    getRepository: (entity: unknown) => {
      if (entity === AdmissionActivity) return activityRepo;
      if (entity === AdmissionAppointment) return appointmentRepo;
      if (entity === AdmissionAppointmentType) return typesRepo;
      return assigneeRepo;
    },
  };
  return {
    transaction: jest.fn((cb: (m: typeof manager) => unknown) => cb(manager)),
  } as unknown as DataSource;
}

describe('AdmissionAppointmentsService', () => {
  let service: AdmissionAppointmentsService;
  let repo: ReturnType<typeof createMockRepository>;
  let applicationsRepo: ReturnType<typeof createMockRepository>;
  let typesRepo: ReturnType<typeof createMockRepository>;
  let membershipsRepo: ReturnType<typeof createMockRepository>;
  let capture: {
    assignees: Array<Record<string, unknown>>;
    activities: Array<Record<string, unknown>>;
  };

  beforeEach(async () => {
    repo = createMockRepository();
    applicationsRepo = createMockRepository();
    typesRepo = createMockRepository();
    membershipsRepo = createMockRepository();
    capture = { assignees: [], activities: [] };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionAppointmentsService,
        { provide: getRepositoryToken(AdmissionAppointment), useValue: repo },
        {
          provide: getRepositoryToken(AdmissionApplication),
          useValue: applicationsRepo,
        },
        {
          provide: getRepositoryToken(AdmissionAppointmentType),
          useValue: typesRepo,
        },
        {
          provide: getRepositoryToken(Membership),
          useValue: membershipsRepo,
        },
        {
          provide: getRepositoryToken(AdmissionAppointmentAssignee),
          useValue: createMockRepository(),
        },
        {
          provide: DataSource,
          useValue: makeDataSource(capture, repo, typesRepo),
        },
      ],
    }).compile();

    service = module.get(AdmissionAppointmentsService);
  });

  describe('findByApplication', () => {
    it('throws when the application is not in the org (multi-tenant)', async () => {
      applicationsRepo.findOne.mockResolvedValue(null);
      await expect(
        service.findByApplication('app-foreign', ORG_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(applicationsRepo.findOne.mock.calls[0][0].where).toEqual({
        id: 'app-foreign',
        organizationId: ORG_ID,
      });
    });

    it('lists appointments org-scoped for a valid application', async () => {
      applicationsRepo.findOne.mockResolvedValue({ id: 'app-1' });
      await service.findByApplication('app-1', ORG_ID);
      expect(repo.find.mock.calls[0][0].where).toEqual({
        applicationId: 'app-1',
        organizationId: ORG_ID,
      });
    });
  });

  describe('create', () => {
    it('creates an appointment for a valid application', async () => {
      applicationsRepo.findOne.mockResolvedValue({ id: 'app-1' });
      await service.create(
        {
          applicationId: 'app-1',
          scheduledAt: '2026-07-10T09:00:00.000Z',
          location: 'Büro',
        },
        ORG_ID,
        'mem-creator',
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_ID,
          applicationId: 'app-1',
          appointmentTypeId: null,
          location: 'Büro',
          createdByMembershipId: 'mem-creator',
        }),
      );
    });

    it('creates a mirror MEETING activity (subject from title, occurredAt from scheduledAt)', async () => {
      applicationsRepo.findOne.mockResolvedValue({ id: 'app-1' });
      await service.create(
        {
          applicationId: 'app-1',
          title: 'Schnuppertag',
          scheduledAt: '2026-07-10T09:00:00.000Z',
          note: 'Bitte pünktlich',
          durationMinutes: 90,
        },
        ORG_ID,
        'mem-creator',
      );
      expect(capture.activities).toHaveLength(1);
      const activity = capture.activities[0];
      expect(activity.type).toBe(AdmissionActivityType.MEETING);
      expect(activity.subject).toBe('Schnuppertag');
      expect(activity.organizationId).toBe(ORG_ID);
      expect(activity.applicationId).toBe('app-1');
      expect(activity.body).toBe('Bitte pünktlich');
      expect(activity.durationMinutes).toBe(90);
      expect((activity.occurredAt as Date).toISOString()).toBe(
        '2026-07-10T09:00:00.000Z',
      );
      // The appointment is linked back to the activity.
      const appt = repo.save.mock.calls[0][0] as { activityId?: string };
      expect(appt.activityId).toBe('act-1');
    });

    it('falls back to the appointment type label for the activity subject', async () => {
      applicationsRepo.findOne.mockResolvedValue({ id: 'app-1' });
      typesRepo.findOne.mockResolvedValue({ label: 'Elterngespräch' });
      await service.create(
        {
          applicationId: 'app-1',
          appointmentTypeId: 'type-1',
          scheduledAt: '2026-07-10T09:00:00.000Z',
        },
        ORG_ID,
        null,
      );
      expect(capture.activities[0].subject).toBe('Elterngespräch');
    });

    it('stores a period (endsAt) and links multiple assignees', async () => {
      applicationsRepo.findOne.mockResolvedValue({ id: 'app-1' });
      repo.save.mockResolvedValue({ id: 'apt-1' });
      membershipsRepo.find.mockResolvedValue([
        { id: 'mem-a' },
        { id: 'mem-b' },
      ]);
      await service.create(
        {
          applicationId: 'app-1',
          scheduledAt: '2026-07-10T09:00:00.000Z',
          endsAt: '2026-07-14T17:00:00.000Z',
          assignedToMembershipIds: ['mem-a', 'mem-b'],
        },
        ORG_ID,
        'mem-creator',
      );
      const created = repo.create.mock.calls[0][0] as { endsAt: Date | null };
      expect(created.endsAt).toBeInstanceOf(Date);
      // Both memberships were linked via the join table (org-scoped).
      expect(capture.assignees).toHaveLength(2);
      expect(capture.assignees.map((a) => a.membershipId).sort()).toEqual([
        'mem-a',
        'mem-b',
      ]);
      expect(capture.assignees.every((a) => a.organizationId === ORG_ID)).toBe(
        true,
      );
    });

    it('rejects an assignee that is not a member of the org (multi-tenant)', async () => {
      applicationsRepo.findOne.mockResolvedValue({ id: 'app-1' });
      repo.save.mockResolvedValue({ id: 'apt-1' });
      // Only one of the two requested memberships is found in this org.
      membershipsRepo.find.mockResolvedValue([{ id: 'mem-a' }]);
      await expect(
        service.create(
          {
            applicationId: 'app-1',
            scheduledAt: '2026-07-10T09:00:00.000Z',
            assignedToMembershipIds: ['mem-a', 'mem-foreign'],
          },
          ORG_ID,
          null,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(capture.assignees).toHaveLength(0);
    });

    it('leaves endsAt null for a single-point appointment', async () => {
      applicationsRepo.findOne.mockResolvedValue({ id: 'app-1' });
      await service.create(
        { applicationId: 'app-1', scheduledAt: '2026-07-10T09:00:00.000Z' },
        ORG_ID,
        null,
      );
      const created = repo.create.mock.calls[0][0] as { endsAt: Date | null };
      expect(created.endsAt).toBeNull();
    });

    it('rejects a period whose end is not after its start', async () => {
      applicationsRepo.findOne.mockResolvedValue({ id: 'app-1' });
      await expect(
        service.create(
          {
            applicationId: 'app-1',
            scheduledAt: '2026-07-10T09:00:00.000Z',
            endsAt: '2026-07-10T09:00:00.000Z',
          },
          ORG_ID,
          null,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the application is from another org', async () => {
      applicationsRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create(
          { applicationId: 'app-foreign', scheduledAt: '2026-07-10T09:00:00Z' },
          ORG_ID,
          null,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when appointmentType is from another org', async () => {
      applicationsRepo.findOne.mockResolvedValue({ id: 'app-1' });
      typesRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create(
          {
            applicationId: 'app-1',
            appointmentTypeId: 'type-foreign',
            scheduledAt: '2026-07-10T09:00:00Z',
          },
          ORG_ID,
          null,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(typesRepo.findOne.mock.calls[0][0].where).toEqual({
        id: 'type-foreign',
        organizationId: ORG_ID,
      });
    });
  });

  describe('update (multi-tenant isolation)', () => {
    it('throws when the appointment belongs to another org', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.update({ id: 'apt-foreign', note: 'x' }, ORG_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.findOne.mock.calls[0][0].where).toEqual({
        id: 'apt-foreign',
        organizationId: ORG_ID,
      });
    });

    it('applies status and note changes for an owned appointment', async () => {
      repo.findOne.mockResolvedValue({
        id: 'apt-1',
        organizationId: ORG_ID,
      });
      const res = await service.update(
        { id: 'apt-1', note: 'Neuer Termin' },
        ORG_ID,
      );
      expect(res.note).toBe('Neuer Termin');
    });

    it('replaces the assignee set (org-scoped)', async () => {
      repo.findOne.mockResolvedValue({ id: 'apt-1', organizationId: ORG_ID });
      membershipsRepo.find.mockResolvedValue([{ id: 'mem-new' }]);
      await service.update(
        { id: 'apt-1', assignedToMembershipIds: ['mem-new'] },
        ORG_ID,
      );
      expect(capture.assignees.map((a) => a.membershipId)).toEqual(['mem-new']);
    });

    it('does not touch assignees when the field is omitted', async () => {
      repo.findOne.mockResolvedValue({ id: 'apt-1', organizationId: ORG_ID });
      await service.update({ id: 'apt-1', note: 'x' }, ORG_ID);
      expect(membershipsRepo.find).not.toHaveBeenCalled();
      expect(capture.assignees).toHaveLength(0);
    });

    it('rejects an update that makes the end precede the start', async () => {
      repo.findOne.mockResolvedValue({
        id: 'apt-1',
        organizationId: ORG_ID,
        scheduledAt: new Date('2026-07-10T09:00:00.000Z'),
        endsAt: null,
      });
      await expect(
        service.update(
          { id: 'apt-1', endsAt: '2026-07-09T09:00:00.000Z' },
          ORG_ID,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('remove (multi-tenant isolation)', () => {
    it('throws when deleting an appointment from another org', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.remove('apt-foreign', ORG_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('deletes an owned appointment org-scoped', async () => {
      repo.findOne.mockResolvedValue({ id: 'apt-1' });
      const ok = await service.remove('apt-1', ORG_ID);
      expect(ok).toBe(true);
      expect(repo.delete).toHaveBeenCalledWith({
        id: 'apt-1',
        organizationId: ORG_ID,
      });
    });
  });
});
