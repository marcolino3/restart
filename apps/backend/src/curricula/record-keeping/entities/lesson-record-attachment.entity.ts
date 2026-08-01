import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { User } from '@/users/entities/user.entity';
import { Field, HideField, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { LessonRecord } from './lesson-record.entity';

/**
 * A file attached to a lesson record (photo of the child's work, a scanned
 * worksheet, a PDF). Metadata lives here; the binary sits in object storage
 * under an org-scoped key and is reachable ONLY through the authenticated,
 * org-scoped LessonRecordAttachmentsController — never as a public/static
 * asset (multi-tenant isolation by construction — mirrors MessageAttachment
 * and StudentRecordDocument).
 */
@ObjectType()
@Entity('lesson_record_attachments')
@Index('idx_lesson_record_attachments_record', ['lessonRecordId'])
@Index('idx_lesson_record_attachments_org', ['organizationId'])
export class LessonRecordAttachment extends AbstractEntity<LessonRecordAttachment> {
  @Field(() => ID)
  @Column('uuid', { name: 'lesson_record_id' })
  lessonRecordId: string;

  @Field(() => LessonRecord, { nullable: true })
  @ManyToOne(() => LessonRecord, (record) => record.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson_record_id' })
  lessonRecord?: LessonRecord;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  /**
   * Object-storage key of the binary. Hidden from GraphQL on purpose: the
   * client never addresses storage directly, it goes through the REST
   * download route, and exposing the key would leak the storage layout.
   */
  @HideField()
  @Column('text', { name: 'storage_key' })
  storageKey: string;

  @Field(() => String, { name: 'fileName' })
  @Column('text', { name: 'file_name' })
  fileName: string;

  @Field(() => String)
  @Column('text', { name: 'mime_type' })
  mimeType: string;

  @Field(() => Int)
  @Column('int', { name: 'size_bytes' })
  sizeBytes: number;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'uploaded_by_id', nullable: true })
  uploadedById?: string | null;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy?: User | null;
}
