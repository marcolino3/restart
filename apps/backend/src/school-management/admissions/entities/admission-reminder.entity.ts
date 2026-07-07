import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AdmissionApplication } from './admission-application.entity';

@ObjectType()
@Entity('admission_reminders')
@Index('idx_admission_reminders_org_due', ['organizationId', 'dueAt'])
@Index('idx_admission_reminders_app', ['applicationId'])
@Index('idx_admission_reminders_assignee_due', [
  'assignedToMembershipId',
  'dueAt',
])
export class AdmissionReminder extends AbstractEntity<AdmissionReminder> {
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

  @Field(() => Date)
  @Column('timestamptz', { name: 'due_at' })
  dueAt: Date;

  @Field(() => String)
  @Column('varchar', { length: 200 })
  title: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  note?: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'assigned_to_membership_id', nullable: true })
  assignedToMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to_membership_id' })
  assignedToMembership?: Membership | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'created_by_membership_id', nullable: true })
  createdByMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_membership_id' })
  createdByMembership?: Membership | null;

  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'completed_at', nullable: true })
  completedAt?: Date | null;

  /**
   * When the due-reminder notification email was sent to the assignee. Set once
   * by the daily notifier cron so an overdue reminder is not re-mailed every
   * morning; `null` means no notification has been sent yet.
   */
  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'notified_at', nullable: true })
  notifiedAt?: Date | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'completed_by_membership_id', nullable: true })
  completedByMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'completed_by_membership_id' })
  completedByMembership?: Membership | null;
}
