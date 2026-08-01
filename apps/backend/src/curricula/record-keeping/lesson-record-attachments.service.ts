import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LessonRecordAttachment } from './entities/lesson-record-attachment.entity';
import { LessonRecord } from './entities/lesson-record.entity';

/**
 * Metadata side of lesson-record attachments. Every method takes the caller's
 * active organization id and filters on it, so a row belonging to another
 * tenant is simply not found — the isolation lives here rather than in the
 * controller so it cannot be forgotten at a call site.
 */
@Injectable()
export class LessonRecordAttachmentsService {
  constructor(
    @InjectRepository(LessonRecordAttachment)
    private readonly attachmentsRepo: Repository<LessonRecordAttachment>,
    @InjectRepository(LessonRecord)
    private readonly recordsRepo: Repository<LessonRecord>,
  ) {}

  /**
   * Asserts the lesson record exists inside the caller's org. Throws
   * ForbiddenException for a record that exists elsewhere as well as for one
   * that does not exist at all — distinguishing the two would confirm the
   * existence of another tenant's ids.
   */
  async assertRecordInOrg(
    lessonRecordId: string,
    organizationId: string,
  ): Promise<void> {
    const exists = await this.recordsRepo.exists({
      where: { id: lessonRecordId, organizationId },
    });
    if (!exists) {
      throw new ForbiddenException('Lesson record outside active organization');
    }
  }

  async create(data: {
    lessonRecordId: string;
    organizationId: string;
    storageKey: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedById: string | null;
  }): Promise<LessonRecordAttachment> {
    const attachment = this.attachmentsRepo.create(data);
    return this.attachmentsRepo.save(attachment);
  }

  /** Loads an attachment owned by the caller's org, or throws 404. */
  async findOneOwned(
    id: string,
    organizationId: string,
  ): Promise<LessonRecordAttachment> {
    const attachment = await this.attachmentsRepo.findOne({
      where: { id, organizationId },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    return attachment;
  }

  async findByRecord(
    lessonRecordId: string,
    organizationId: string,
  ): Promise<LessonRecordAttachment[]> {
    return this.attachmentsRepo.find({
      where: { lessonRecordId, organizationId },
      order: { createdAt: 'ASC' },
    });
  }

  /** Deletes the metadata row. The org filter is part of the DELETE itself so
   *  a stale id from another tenant cannot remove anything. */
  async remove(id: string, organizationId: string): Promise<void> {
    await this.attachmentsRepo.delete({ id, organizationId });
  }
}
