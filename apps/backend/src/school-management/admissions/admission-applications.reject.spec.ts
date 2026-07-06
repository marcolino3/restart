import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AdmissionRejectionReason } from '../admission-rejection-reasons/entities/admission-rejection-reason.entity';
import { AdmissionStage } from '../admission-stages/entities/admission-stage.entity';
import { ContactPerson } from '../contact-persons/entities/contact-person.entity';
import { Family } from '../families/entities/family.entity';
import { AdmissionApplicationsService } from './admission-applications.service';
import { AdmissionAuditLogsService } from './admission-audit-logs.service';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionApplicationStatus } from './enums/admission-application-status.enum';

const ORG = 'org-1';

describe('AdmissionApplicationsService.reject (Wiedervorlage)', () => {
  let service: AdmissionApplicationsService;
  let applicationsRepo: Record<string, jest.Mock>;
  let stagesRepo: Record<string, jest.Mock>;
  let rejectionReasonsRepo: Record<string, jest.Mock>;
  let auditLogs: { logAction: jest.Mock };
  let saved: Partial<AdmissionApplication> | undefined;

  beforeEach(async () => {
    saved = undefined;
    const application: Partial<AdmissionApplication> = {
      id: 'app-1',
      organizationId: ORG,
      status: AdmissionApplicationStatus.ACTIVE,
    };
    applicationsRepo = {
      findOne: jest.fn().mockResolvedValue(application),
      save: jest.fn((a: Partial<AdmissionApplication>) => {
        saved = a;
        return Promise.resolve(a);
      }),
    };
    stagesRepo = { findOne: jest.fn().mockResolvedValue(null) };
    rejectionReasonsRepo = { findOne: jest.fn() };
    auditLogs = { logAction: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionApplicationsService,
        { provide: DataSource, useValue: {} },
        { provide: AdmissionAuditLogsService, useValue: auditLogs },
        {
          provide: getRepositoryToken(AdmissionApplication),
          useValue: applicationsRepo,
        },
        { provide: getRepositoryToken(AdmissionStage), useValue: stagesRepo },
        {
          provide: getRepositoryToken(AdmissionRejectionReason),
          useValue: rejectionReasonsRepo,
        },
        { provide: getRepositoryToken(Family), useValue: {} },
        { provide: getRepositoryToken(ContactPerson), useValue: {} },
      ],
    }).compile();

    service = module.get(AdmissionApplicationsService);
  });

  it('persists a trimmed follow-up year alongside rejectedBy', async () => {
    await service.reject(
      {
        id: 'app-1',
        rejectedBy: 'SCHOOL' as never,
        followUpYear: '  2027/28 ',
      },
      ORG,
      'actor-1',
    );

    expect(saved?.status).toBe(AdmissionApplicationStatus.REJECTED);
    expect(saved?.rejectedBy).toBe('SCHOOL');
    expect(saved?.followUpYear).toBe('2027/28');
  });

  it('stores null when no follow-up year is given (final rejection)', async () => {
    await service.reject({ id: 'app-1' }, ORG, 'actor-1');

    expect(saved?.followUpYear).toBeNull();
    expect(saved?.rejectedBy).toBeNull();
  });

  it('scopes the lookup to the active organization', async () => {
    await service.reject({ id: 'app-1', followUpYear: '2028/29' }, ORG, null);

    expect(applicationsRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'app-1', organizationId: ORG },
      }),
    );
  });
});
