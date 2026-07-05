import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { RetentionAction } from '@/retention/enums/retention-action.enum';
import { RetentionEntityType } from '@/retention/enums/retention-entity-type.enum';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PurgeStatus } from '../enums/purge-status.enum';

/**
 * A record identified by the retention scan as past its retention period and a
 * candidate for the policy's action (DELETE / ANONYMIZE). It must be APPROVED by
 * an admin before it is ever executed — the scan never deletes anything.
 * One open candidate per (org, entityType, subjectId).
 */
@ObjectType()
@Entity('purge_candidates')
@Index('idx_purge_candidates_org', ['organizationId'])
@Index('idx_purge_candidates_status', ['status'])
@Index(
  'UQ_purge_candidate_org_entity_subject',
  ['organizationId', 'entityType', 'subjectId'],
  { unique: true },
)
export class PurgeCandidate extends AbstractEntity<PurgeCandidate> {
  @Field(() => RetentionEntityType)
  @Column('enum', { enum: RetentionEntityType, name: 'entity_type' })
  entityType: RetentionEntityType;

  @Field(() => ID)
  @Column('uuid', { name: 'subject_id' })
  subjectId: string;

  /** Human label captured at scan time (survives even after the record is gone). */
  @Field(() => String)
  @Column('text', { name: 'subject_label' })
  subjectLabel: string;

  /** The date the retention period lapsed (anchor + retentionMonths). */
  @Field(() => Date)
  @Column('date', { name: 'due_since' })
  dueSince: Date;

  @Field(() => RetentionAction)
  @Column('enum', { enum: RetentionAction, name: 'action' })
  action: RetentionAction;

  @Field(() => PurgeStatus)
  @Column('enum', {
    enum: PurgeStatus,
    name: 'status',
    default: PurgeStatus.PENDING,
  })
  status: PurgeStatus;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'reviewed_by_membership_id', nullable: true })
  reviewedByMembershipId?: string | null;

  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'reviewed_at', nullable: true })
  reviewedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'executed_at', nullable: true })
  executedAt?: Date | null;

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
