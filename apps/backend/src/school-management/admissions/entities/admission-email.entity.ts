import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AdmissionEmailStatus } from '../enums/admission-email-status.enum';
import { AdmissionApplication } from './admission-application.entity';
import { EmailTemplate } from './email-template.entity';

/**
 * Tracked record of an email sent (or attempted) from an admission application.
 * This is the source of truth for outbound admission emails incl. delivery
 * status — a failed send is still persisted (status = FAILED) for tracking.
 */
@ObjectType()
@Entity('admission_emails')
@Index('idx_admission_emails_org', ['organizationId'])
@Index('idx_admission_emails_app_sent', ['applicationId', 'sentAt'])
export class AdmissionEmail extends AbstractEntity<AdmissionEmail> {
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

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'template_id', nullable: true })
  templateId?: string | null;

  @Field(() => EmailTemplate, { nullable: true })
  @ManyToOne(() => EmailTemplate, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'template_id' })
  template?: EmailTemplate | null;

  @Field(() => String)
  @Column('varchar', { name: 'to_email', length: 320 })
  toEmail: string;

  @Field(() => String, { nullable: true })
  @Column('varchar', { name: 'to_name', length: 200, nullable: true })
  toName?: string | null;

  @Field(() => String)
  @Column('varchar', { length: 300 })
  subject: string;

  @Field(() => String)
  @Column('text', { name: 'body_html' })
  bodyHtml: string;

  @Field(() => AdmissionEmailStatus)
  @Column('enum', { enum: AdmissionEmailStatus })
  status: AdmissionEmailStatus;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'error_message', nullable: true })
  errorMessage?: string | null;

  @Field(() => String, { nullable: true })
  @Column('varchar', {
    name: 'provider_message_id',
    length: 998,
    nullable: true,
  })
  providerMessageId?: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'sent_by_membership_id', nullable: true })
  sentByMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sent_by_membership_id' })
  sentByMembership?: Membership | null;

  @Field(() => Date)
  @Column('timestamptz', {
    name: 'sent_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  sentAt: Date;
}
