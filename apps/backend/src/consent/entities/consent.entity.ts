import { AbstractEntity } from '@/database/abstract.entity';
import { ContactPerson } from '@/school-management/contact-persons/entities/contact-person.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ConsentStatus } from '../enums/consent-status.enum';
import { ConsentSubjectType } from '../enums/consent-subject-type.enum';
import { ConsentPurpose } from './consent-purpose.entity';

/**
 * The current consent decision for one (purpose × subject). Exactly one row per
 * combination (see unique index); the full history lives in ConsentAuditLog.
 * `subjectId` is polymorphic (see subjectType) so there is no DB-level FK on it.
 */
@ObjectType()
@Entity('consents')
@Index('idx_consents_org', ['organizationId'])
@Index('idx_consents_subject', ['subjectType', 'subjectId'])
@Index(
  'UQ_consent_org_purpose_subject',
  ['organizationId', 'purposeId', 'subjectType', 'subjectId'],
  { unique: true },
)
export class Consent extends AbstractEntity<Consent> {
  @Field(() => ConsentSubjectType)
  @Column('enum', { enum: ConsentSubjectType, name: 'subject_type' })
  subjectType: ConsentSubjectType;

  @Field(() => ID)
  @Column('uuid', { name: 'subject_id' })
  subjectId: string;

  @Field(() => ID)
  @Column('uuid', { name: 'purpose_id' })
  purposeId: string;

  @Field(() => ConsentPurpose, { nullable: true })
  @ManyToOne(() => ConsentPurpose, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purpose_id' })
  purpose?: ConsentPurpose;

  @Field(() => ConsentStatus)
  @Column('enum', { enum: ConsentStatus, name: 'status' })
  status: ConsentStatus;

  /**
   * For a STUDENT (child) the consent is granted by a guardian — the contact
   * person who holds custody. Null for employees (they consent for themselves).
   */
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'granted_by_contact_person_id', nullable: true })
  grantedByContactPersonId?: string | null;

  @Field(() => ContactPerson, { nullable: true })
  @ManyToOne(() => ContactPerson, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'granted_by_contact_person_id' })
  grantedByContactPerson?: ContactPerson | null;

  /** The staff member who recorded this decision. */
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'actor_membership_id', nullable: true })
  actorMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_membership_id' })
  actorMembership?: Membership | null;

  @Field(() => Date)
  @Column('timestamptz', { name: 'decided_at', default: () => 'now()' })
  decidedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'withdrawn_at', nullable: true })
  withdrawnAt?: Date | null;

  /** Authenticated, org-scoped URL of the signed consent document. */
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'evidence_url', nullable: true })
  evidenceUrl?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  note?: string | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
