import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken } from '@nestjs/typeorm';

import { DataExportService } from './data-export.service';
import { DataSubjectType } from '@/data-requests/enums/data-subject-type.enum';

const ORG_A = 'org-a';

describe('DataExportService', () => {
  let service: DataExportService;
  let manager: { findOne: jest.Mock; find: jest.Mock };

  beforeEach(async () => {
    manager = { findOne: jest.fn(), find: jest.fn().mockResolvedValue([]) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataExportService,
        { provide: getEntityManagerToken(), useValue: manager },
      ],
    }).compile();

    service = module.get(DataExportService);
  });

  it('rejects an unsupported subject type', async () => {
    await expect(
      service.export(DataSubjectType.OTHER, 's1', ORG_A),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFound for a student outside the org (multi-tenant)', async () => {
    manager.findOne.mockResolvedValue(null);
    await expect(
      service.export(DataSubjectType.STUDENT, 's1', ORG_A),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.findOne).toHaveBeenCalledWith(expect.anything(), {
      where: { id: 's1', organizationId: ORG_A },
    });
  });

  it('assembles a structured student export', async () => {
    manager.findOne.mockResolvedValue({
      id: 's1',
      firstName: 'Kim',
      lastName: 'Muster',
      organizationId: ORG_A,
    });

    const bundle = await service.export(DataSubjectType.STUDENT, 's1', ORG_A);

    expect(bundle.exportType).toBe('STUDENT');
    expect(bundle.generatedAt).toEqual(expect.any(String));
    expect(bundle.subject).toMatchObject({ id: 's1', firstName: 'Kim' });
    expect(bundle.consents).toEqual([]);
    expect(bundle.dataSubjectRequests).toEqual([]);
  });

  it('throws NotFound when the employee belongs to another org', async () => {
    manager.findOne.mockResolvedValue({
      id: 'e1',
      membership: { organizationId: 'org-other', user: {} },
    });
    await expect(
      service.export(DataSubjectType.EMPLOYEE, 'e1', ORG_A),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
