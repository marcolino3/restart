import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Records the last recertification of one membership's sensitive-data access
 * (access review / Zugriffs-Review). One row per (org, membership). The review
 * itself is computed live from RBAC; this only stamps "reviewed on / by".
 */
@ObjectType()
@Entity('access_review_records')
@Index('idx_access_review_records_org', ['organizationId'])
@Index('UQ_access_review_org_membership', ['organizationId', 'membershipId'], {
  unique: true,
})
export class AccessReviewRecord extends AbstractEntity<AccessReviewRecord> {
  @Field(() => ID)
  @Column('uuid', { name: 'membership_id' })
  membershipId: string;

  @Field(() => Date)
  @Column('timestamptz', { name: 'last_reviewed_at' })
  lastReviewedAt: Date;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'reviewed_by_membership_id', nullable: true })
  reviewedByMembershipId?: string | null;

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
