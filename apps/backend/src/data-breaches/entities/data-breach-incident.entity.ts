import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DataBreachRiskLevel } from '../enums/data-breach-risk-level.enum';
import { DataBreachStatus } from '../enums/data-breach-status.enum';

/**
 * A personal-data breach (Datenpanne) with its guided notification workflow
 * (DSGVO Art. 33/34 / revDSG). `detectedAt` starts the 72-hour authority
 * notification clock; the presence of `authorityNotifiedAt` / `subjectsNotifiedAt`
 * records that each obligation was met. Org-scoped.
 */
@ObjectType()
@Entity('data_breach_incidents')
@Index('idx_data_breach_incidents_org', ['organizationId'])
@Index('idx_data_breach_incidents_status', ['status'])
export class DataBreachIncident extends AbstractEntity<DataBreachIncident> {
  @Field(() => String)
  @Column('text')
  title: string;

  @Field(() => String)
  @Column('text')
  description: string;

  /** When the breach was discovered — starts the 72h authority-notification clock. */
  @Field(() => Date)
  @Column('timestamptz', { name: 'detected_at', default: () => 'now()' })
  detectedAt: Date;

  @Field(() => DataBreachStatus)
  @Column('enum', {
    enum: DataBreachStatus,
    name: 'status',
    default: DataBreachStatus.OPEN,
  })
  status: DataBreachStatus;

  @Field(() => DataBreachRiskLevel)
  @Column('enum', {
    enum: DataBreachRiskLevel,
    name: 'risk_level',
    default: DataBreachRiskLevel.MEDIUM,
  })
  riskLevel: DataBreachRiskLevel;

  /** What data / which persons are affected. */
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'affected_scope', nullable: true })
  affectedScope?: string | null;

  @Field(() => Int, { nullable: true })
  @Column('int', { name: 'affected_count', nullable: true })
  affectedCount?: number | null;

  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'authority_notified_at', nullable: true })
  authorityNotifiedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'subjects_notified_at', nullable: true })
  subjectsNotifiedAt?: Date | null;

  /** Remediation / containment measures taken. */
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  measures?: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'assignee_membership_id', nullable: true })
  assigneeMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignee_membership_id' })
  assigneeMembership?: Membership | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'created_by_membership_id', nullable: true })
  createdByMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_membership_id' })
  createdByMembership?: Membership | null;

  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'closed_at', nullable: true })
  closedAt?: Date | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  notes?: string | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
