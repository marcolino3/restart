import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DataSubjectRequestStatus } from '../enums/data-subject-request-status.enum';
import { DataSubjectRequestType } from '../enums/data-subject-request-type.enum';
import { DataSubjectType } from '../enums/data-subject-type.enum';

/**
 * A data-subject request (Betroffenenanfrage) tracked to its statutory deadline.
 * Org-scoped. `subjectId` optionally links a system record (student/employee/…)
 * but `subjectName` is always captured so external requesters are supported.
 */
@ObjectType()
@Entity('data_subject_requests')
@Index('idx_data_subject_requests_org', ['organizationId'])
@Index('idx_data_subject_requests_status', ['status'])
@Index('idx_data_subject_requests_due', ['dueDate'])
export class DataSubjectRequest extends AbstractEntity<DataSubjectRequest> {
  @Field(() => DataSubjectRequestType)
  @Column('enum', { enum: DataSubjectRequestType, name: 'request_type' })
  type: DataSubjectRequestType;

  @Field(() => DataSubjectRequestStatus)
  @Column('enum', {
    enum: DataSubjectRequestStatus,
    name: 'status',
    default: DataSubjectRequestStatus.NEW,
  })
  status: DataSubjectRequestStatus;

  @Field(() => DataSubjectType)
  @Column('enum', {
    enum: DataSubjectType,
    name: 'subject_type',
    default: DataSubjectType.OTHER,
  })
  subjectType: DataSubjectType;

  /** Optional link to the system record the request concerns. */
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'subject_id', nullable: true })
  subjectId?: string | null;

  @Field(() => String)
  @Column('text', { name: 'subject_name' })
  subjectName: string;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'contact_email', nullable: true })
  contactEmail?: string | null;

  /** When the request reached the organization — starts the deadline clock. */
  @Field(() => Date)
  @Column('date', { name: 'received_at' })
  receivedAt: Date;

  /** Statutory deadline (received + 1 month; DSGVO Art. 12(3) / revDSG). */
  @Field(() => Date)
  @Column('date', { name: 'due_date' })
  dueDate: Date;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'assignee_membership_id', nullable: true })
  assigneeMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignee_membership_id' })
  assigneeMembership?: Membership | null;

  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'resolved_at', nullable: true })
  resolvedAt?: Date | null;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'resolution_note', nullable: true })
  resolutionNote?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  notes?: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'created_by_membership_id', nullable: true })
  createdByMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_membership_id' })
  createdByMembership?: Membership | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
