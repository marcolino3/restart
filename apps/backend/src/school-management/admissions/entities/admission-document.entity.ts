import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AdmissionApplication } from './admission-application.entity';

/**
 * A file attachment (PDF/image) for an admission application. Metadata lives
 * here; the binary is stored in object storage under an org-scoped key derived
 * from `fileId` and reachable only via the authenticated, org-scoped
 * AdmissionDocumentsController (multi-tenant isolation by construction).
 */
@ObjectType()
@Entity('admission_documents')
@Index('idx_admission_documents_org', ['organizationId'])
@Index('idx_admission_documents_app', ['applicationId'])
export class AdmissionDocument extends AbstractEntity<AdmissionDocument> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'application_id' })
  applicationId: string;

  @Field(() => AdmissionApplication, { nullable: true })
  @ManyToOne(() => AdmissionApplication, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application?: AdmissionApplication;

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
