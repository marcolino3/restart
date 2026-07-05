import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ConsentAuditAction } from '../enums/consent-audit-action.enum';
import { ConsentStatus } from '../enums/consent-status.enum';
import { ConsentSubjectType } from '../enums/consent-subject-type.enum';

/**
 * Append-only proof trail for every consent decision. Denormalized on purpose:
 * `purposeId`/`subjectId` are plain columns (no FK) so entries stay readable
 * after the referenced purpose or consent row is removed.
 */
@ObjectType()
@Entity('consent_audit_logs')
@Index('idx_consent_audit_logs_org', ['organizationId'])
@Index('idx_consent_audit_logs_subject', ['subjectType', 'subjectId'])
export class ConsentAuditLog extends AbstractEntity<ConsentAuditLog> {
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'consent_id', nullable: true })
  consentId?: string | null;

  @Field(() => ID)
  @Column('uuid', { name: 'purpose_id' })
  purposeId: string;

  @Field(() => ConsentSubjectType)
  @Column('enum', { enum: ConsentSubjectType, name: 'subject_type' })
  subjectType: ConsentSubjectType;

  @Field(() => ID)
  @Column('uuid', { name: 'subject_id' })
  subjectId: string;

  @Field(() => ConsentAuditAction)
  @Column('enum', { enum: ConsentAuditAction, name: 'action' })
  action: ConsentAuditAction;

  @Field(() => ConsentStatus, { nullable: true })
  @Column('enum', {
    enum: ConsentStatus,
    name: 'previous_status',
    nullable: true,
  })
  previousStatus?: ConsentStatus | null;

  @Field(() => ConsentStatus, { nullable: true })
  @Column('enum', { enum: ConsentStatus, name: 'new_status', nullable: true })
  newStatus?: ConsentStatus | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'actor_membership_id', nullable: true })
  actorMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_membership_id' })
  actorMembership?: Membership | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  note?: string | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
