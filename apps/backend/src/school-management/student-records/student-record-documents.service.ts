import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentRecordEntry } from './entities/student-record-entry.entity';
import { StudentRecordDocument } from './entities/student-record-document.entity';

@Injectable()
export class StudentRecordDocumentsService {
  constructor(
    @InjectRepository(StudentRecordDocument)
    private readonly repo: Repository<StudentRecordDocument>,
    @InjectRepository(StudentRecordEntry)
    private readonly entriesRepo: Repository<StudentRecordEntry>,
  ) {}

  private async assertEntryInOrg(
    entryId: string,
    organizationId: string,
  ): Promise<void> {
    const entry = await this.entriesRepo.findOne({
      where: { id: entryId, organizationId },
      select: ['id'],
    });
    if (!entry) {
      throw new NotFoundException(`Student record entry ${entryId} not found`);
    }
  }

  /** Resolves the owning studentId for visibility checks ahead of read. */
  async getStudentIdForEntry(
    entryId: string,
    organizationId: string,
  ): Promise<string> {
    const entry = await this.entriesRepo.findOne({
      where: { id: entryId, organizationId },
      select: ['id', 'studentId'],
    });
    if (!entry) {
      throw new NotFoundException(`Student record entry ${entryId} not found`);
    }
    return entry.studentId;
  }

  async findByEntry(
    entryId: string,
    organizationId: string,
  ): Promise<StudentRecordDocument[]> {
    await this.assertEntryInOrg(entryId, organizationId);
    return this.repo.find({
      where: { entryId, organizationId },
      relations: ['uploadedByMembership', 'uploadedByMembership.user'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Persists a new document metadata row after the binary is stored. */
  async create(input: {
    organizationId: string;
    entryId: string;
    fileId: string;
    originalName: string;
    title?: string | null;
    tags?: string[];
    mimeType: string;
    sizeBytes: number;
    uploadedByMembershipId: string | null;
  }): Promise<StudentRecordDocument> {
    const entity = this.repo.create({
      organizationId: input.organizationId,
      entryId: input.entryId,
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
  ): Promise<StudentRecordDocument> {
    const doc = await this.repo.findOne({
      where: { id, organizationId },
    });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc;
  }

  /** Resolves the owning studentId for a document, for visibility checks. */
  async getStudentIdForDocument(
    doc: StudentRecordDocument,
    organizationId: string,
  ): Promise<string> {
    return this.getStudentIdForEntry(doc.entryId, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    await this.repo.delete({ id, organizationId });
  }
}
