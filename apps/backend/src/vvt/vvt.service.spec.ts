import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { VvtService } from './vvt.service';
import { ProcessingActivity } from './entities/processing-activity.entity';
import { Subprocessor } from './entities/subprocessor.entity';

const ORG_A = 'org-a';
const ORG_B = 'org-b';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((v: Record<string, unknown>) => v),
  save: jest.fn((v: Record<string, unknown>) => Promise.resolve(v)),
});

describe('VvtService', () => {
  let service: VvtService;
  let activities: ReturnType<typeof mockRepo>;
  let subprocessors: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    activities = mockRepo();
    subprocessors = mockRepo();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VvtService,
        {
          provide: getRepositoryToken(ProcessingActivity),
          useValue: activities,
        },
        { provide: getRepositoryToken(Subprocessor), useValue: subprocessors },
      ],
    }).compile();

    service = module.get(VvtService);
  });

  describe('processing activities', () => {
    it('lists org-scoped, non-archived activities', async () => {
      activities.find.mockResolvedValue([]);
      await service.listActivities(ORG_A);
      expect(activities.find).toHaveBeenCalledWith({
        where: { organizationId: ORG_A, isArchived: false },
        order: { createdAt: 'ASC' },
      });
    });

    it('creates an activity scoped to the org', async () => {
      const result = await service.createActivity({ name: 'Payroll' }, ORG_A);
      expect(activities.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Payroll', organizationId: ORG_A }),
      );
      expect(result).toMatchObject({ organizationId: ORG_A });
    });

    it('throws NotFound updating an activity of another org (multi-tenant)', async () => {
      activities.findOne.mockResolvedValue(null);
      await expect(
        service.updateActivity({ id: 'a1', name: 'x' }, ORG_B),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(activities.findOne).toHaveBeenCalledWith({
        where: { id: 'a1', organizationId: ORG_B },
      });
    });
  });

  describe('subprocessors', () => {
    it('lists org-scoped, non-archived subprocessors', async () => {
      subprocessors.find.mockResolvedValue([]);
      await service.listSubprocessors(ORG_A);
      expect(subprocessors.find).toHaveBeenCalledWith({
        where: { organizationId: ORG_A, isArchived: false },
        order: { createdAt: 'ASC' },
      });
    });

    it('throws NotFound archiving a subprocessor of another org', async () => {
      subprocessors.findOne.mockResolvedValue(null);
      await expect(
        service.archiveSubprocessor('s1', ORG_B),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
