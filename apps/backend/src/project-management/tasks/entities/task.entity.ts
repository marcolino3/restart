import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Project } from '@/project-management/projects/entities/project.entity';
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
}
