import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AdmissionDocumentsService } from './admission-documents.service';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionDocument } from './entities/admission-document.entity';

const ORG_ID = 'org-1';

const createMockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  create: jest.fn((d: unknown) => d),
  save: jest.fn((d: unknown) => Promise.resolve(d)),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
});

describe('AdmissionDocumentsService', () => {
  let service: AdmissionDocumentsService;
  let repo: ReturnType<typeof createMockRepository>;
  let applicationsRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repo = createMockRepository();
    applicationsRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdmissionDocumentsService,
        { provide: getRepositoryToken(AdmissionDocument), useValue: repo },
        {
          provide: getRepositoryToken(AdmissionApplication),
          useValue: applicationsRepo,
        },
      ],
    }).compile();

    service = module.get(AdmissionDocumentsService);
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
      expect(repo.find).not.toHaveBeenCalled();
    });

    it('lists documents org- and application-scoped for a valid application', async () => {
      applicationsRepo.findOne.mockResolvedValue({ id: 'app-1' });
      await service.findByApplication('app-1', ORG_ID);
      expect(repo.find.mock.calls[0][0].where).toEqual({
        applicationId: 'app-1',
        organizationId: ORG_ID,
      });
      expect(repo.find.mock.calls[0][0].order).toEqual({ createdAt: 'DESC' });
    });
  });

  describe('findOneOwned (multi-tenant isolation)', () => {
    it('throws when the document belongs to another org', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.findOneOwned('doc-foreign', ORG_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.findOne.mock.calls[0][0].where).toEqual({
        id: 'doc-foreign',
        organizationId: ORG_ID,
      });
    });

    it('returns an owned document', async () => {
      repo.findOne.mockResolvedValue({ id: 'doc-1', organizationId: ORG_ID });
      const doc = await service.findOneOwned('doc-1', ORG_ID);
      expect(doc.id).toBe('doc-1');
    });
  });

  describe('create', () => {
    it('persists metadata org-scoped', async () => {
      await service.create({
        organizationId: ORG_ID,
        applicationId: 'app-1',
        fileId: 'file-1',
        originalName: 'zeugnis.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1234,
        uploadedByMembershipId: 'mem-1',
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_ID,
          applicationId: 'app-1',
          fileId: 'file-1',
          originalName: 'zeugnis.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1234,
          uploadedByMembershipId: 'mem-1',
        }),
      );
    });
  });

  describe('remove', () => {
    it('deletes org-scoped', async () => {
      await service.remove('doc-1', ORG_ID);
      expect(repo.delete).toHaveBeenCalledWith({
        id: 'doc-1',
        organizationId: ORG_ID,
      });
    });
  });
});
