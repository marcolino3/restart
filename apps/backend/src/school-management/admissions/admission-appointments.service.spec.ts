import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { AdmissionAppointmentType } from '@/school-management/admission-appointment-types/entities/admission-appointment-type.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { AdmissionAppointmentsService } from './admission-appointments.service';
import { AdmissionAppointmentAssignee } from './entities/admission-appointment-assignee.entity';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionAppointment } from './entities/admission-appointment.entity';

const ORG_ID = 'org-1';

const createMockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  create: jest.fn((d: unknown) => d),
  save: jest.fn((d: unknown) => Promise.resolve(d)),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
});

// Records the assignee rows written through the transaction manager so tests can
// assert which memberships were linked.
function makeDataSource(capture: {
  assignees: Array<Record<string, unknown>>;
}) {
  const assigneeRepo = {
    create: (d: Record<string, unknown>) => d,
    save: (rows: Array<Record<string, unknown>>) => {
      capture.assignees.push(...rows);
      return Promise.resolve(rows);
    },
    delete: () => Promise.resolve({ affected: 0 }),
  };
  const manager = { getRepository: () => assigneeRepo };
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
  let capture: { assignees: Array<Record<string, unknown>> };

  beforeEach(async () => {
    repo = createMockRepository();
    applicationsRepo = createMockRepository();
    typesRepo = createMockRepository();
    membershipsRepo = createMockRepository();
    capture = { assignees: [] };

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
        { provide: DataSource, useValue: makeDataSource(capture) },
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
