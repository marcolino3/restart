import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Project } from '@/project-management/projects/entities/project.entity';
import { Protocol } from '@/project-management/protocols/entities/protocol.entity';
import { AdmissionApplication } from '@/school-management/admissions/entities/admission-application.entity';
import { AdmissionReminder } from '@/school-management/admissions/entities/admission-reminder.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { TaskAssignee } from './task-assignee.entity';
import { TaskChecklistItem, TaskNote } from './task-details.output';
import { TaskPriority } from './task-priority.enum';
import { TaskStatus } from './task-status.enum';

@ObjectType()
@Entity('tasks')
@Index('idx_tasks_org', ['organizationId'])
@Index('idx_tasks_project', ['projectId'])
export class Task extends AbstractEntity<Task> {
  @Field(() => String)
  @Column('text')
  title: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string | null;

  @Field(() => TaskStatus)
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.OPEN })
  status: TaskStatus;

  @Field(() => TaskPriority)
  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  // Stored as a date (no time component), like other due/enrollment dates in
  // the codebase. Serialised as an ISO date string over GraphQL.
  @Field(() => String, { nullable: true })
  @Column('date', { name: 'due_date', nullable: true })
  dueDate?: string | null;

  // Optional time-of-day for the due date (HH:MM). Kept separate from the
  // date column, mirroring AdmissionReminder's date+time split.
  @Field(() => String, { nullable: true })
  @Column('text', { name: 'due_time', nullable: true })
  dueTime?: string | null;

  // Set on the transition into DONE, cleared when the task is reopened.
  // Drives the "Erledigt am" column and the 30-day window in "My Tasks".
  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'completed_at', nullable: true })
  completedAt?: Date | null;

  @Field(() => [TaskChecklistItem])
  @Column('jsonb', { default: [] })
  checklist: TaskChecklistItem[];

  @Field(() => [TaskNote])
  @Column('jsonb', { default: [] })
  notes: TaskNote[];

  // Ordering within a status column on the board.
  @Field(() => Int)
  @Column('integer', { name: 'sort_order', default: 0 })
  sortOrder: number;

  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // Null for a personal task (a private to-do not tied to any project board).
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'project_id', nullable: true })
  projectId?: string | null;

  @Field(() => Project, { nullable: true })
  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project | null;

  // Null when created by a platform SuperAdmin without an org membership.
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'created_by_membership_id', nullable: true })
  createdByMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_membership_id' })
  createdBy?: Membership;

  @Field(() => [TaskAssignee], { nullable: true })
  @OneToMany(() => TaskAssignee, (assignee) => assignee.task)
  assignees?: TaskAssignee[];

  // Set when the task originated from a meeting protocol ("Sitzungstask"),
  // keeping a reference back to its source. ON DELETE SET NULL: deleting a
  // protocol detaches its tasks rather than removing them.
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'protocol_id', nullable: true })
  protocolId?: string | null;

  @Field(() => Protocol, { nullable: true })
  @ManyToOne(() => Protocol, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'protocol_id' })
  protocol?: Protocol | null;

  // Set when the task was auto-created from an admission reminder
  // ("Erinnerung"). Completing/deleting the reminder keeps its task in sync.
  // ON DELETE SET NULL: deleting the reminder detaches the task (the reminders
  // service soft-deletes the linked task explicitly before hard-deleting).
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'admission_reminder_id', nullable: true })
  admissionReminderId?: string | null;

  @Field(() => AdmissionReminder, { nullable: true })
  @ManyToOne(() => AdmissionReminder, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'admission_reminder_id' })
  admissionReminder?: AdmissionReminder | null;

  // The admission application a reminder belongs to — the "source" surfaced in
  // "My Tasks" (kept even if the reminder itself is later removed).
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'admission_application_id', nullable: true })
  admissionApplicationId?: string | null;

  @Field(() => AdmissionApplication, { nullable: true })
  @ManyToOne(() => AdmissionApplication, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'admission_application_id' })
  admissionApplication?: AdmissionApplication | null;
}
