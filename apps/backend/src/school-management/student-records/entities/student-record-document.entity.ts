import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { StudentRecordEntry } from './student-record-entry.entity';

/**
 * A file attachment (PDF/image) for a student record entry. Metadata lives
 * here; the binary is stored in object storage under an org-scoped key derived
 * from `fileId` and reachable only via the authenticated, org-scoped
 * StudentRecordDocumentsController (multi-tenant isolation by construction).
 * Modeled on AdmissionDocument.
 */
@ObjectType()
@Entity('student_record_documents')
@Index('idx_student_record_documents_org', ['organizationId'])
@Index('idx_student_record_documents_entry', ['entryId'])
export class StudentRecordDocument extends AbstractEntity<StudentRecordDocument> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'entry_id' })
  entryId: string;

  @Field(() => StudentRecordEntry, { nullable: true })
  @ManyToOne(() => StudentRecordEntry, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entry_id' })
  entry?: StudentRecordEntry;

  /** Storage reference used to build the object key — NOT the primary key. */
  @Field(() => ID)
  @Column('uuid', { name: 'file_id' })
  fileId: string;

  @Field(() => String)
  @Column('text', { name: 'original_name' })
  originalName: string;

  /** Optional display title; falls back to `originalName` in the UI when empty. */
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  title?: string | null;

  /** Free-text tags/keywords for the document. */
  @Field(() => [String])
  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Field(() => String)
  @Column('text', { name: 'mime_type' })
  mimeType: string;

  @Field(() => Int)
  @Column('int', { name: 'size_bytes' })
  sizeBytes: number;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'uploaded_by_membership_id', nullable: true })
  uploadedByMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploaded_by_membership_id' })
  uploadedByMembership?: Membership | null;
}
