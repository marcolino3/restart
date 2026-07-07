import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdmissionApplication } from './entities/admission-application.entity';
import { AdmissionDocument } from './entities/admission-document.entity';

@Injectable()
export class AdmissionDocumentsService {
  constructor(
    @InjectRepository(AdmissionDocument)
    private readonly repo: Repository<AdmissionDocument>,
    @InjectRepository(AdmissionApplication)
    private readonly applicationsRepo: Repository<AdmissionApplication>,
  ) {}

  private async assertApplicationInOrg(
    applicationId: string,
    organizationId: string,
  ): Promise<void> {
    const application = await this.applicationsRepo.findOne({
      where: { id: applicationId, organizationId },
      select: ['id'],
    });
    if (!application) {
      throw new NotFoundException(
        `Admission application ${applicationId} not found`,
      );
    }
  }

  async findByApplication(
    applicationId: string,
    organizationId: string,
  ): Promise<AdmissionDocument[]> {
    await this.assertApplicationInOrg(applicationId, organizationId);
    return this.repo.find({
      where: { applicationId, organizationId },
      relations: ['uploadedByMembership', 'uploadedByMembership.user'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Persists a new document metadata row after the binary is stored. */
  async create(input: {
    organizationId: string;
    applicationId: string;
    fileId: string;
    originalName: string;
    title?: string | null;
    tags?: string[];
    mimeType: string;
    sizeBytes: number;
    uploadedByMembershipId: string | null;
  }): Promise<AdmissionDocument> {
    const entity = this.repo.create({
      organizationId: input.organizationId,
      applicationId: input.applicationId,
      fileId: input.fileId,
      originalName: input.originalName,
      title: input.title ?? null,
      tags: input.tags ?? [],
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      uploadedByMembershipId: input.uploadedByMembershipId ?? null,
    });
    return this.repo.save(entity);
  }

  /** Loads a document org-scoped; throws NotFound if it is not the org's. */
  async findOneOwned(
    id: string,
    organizationId: string,
  ): Promise<AdmissionDocument> {
    const doc = await this.repo.findOne({
      where: { id, organizationId },
    });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc;
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.repo.delete({ id, organizationId });
  }
}
