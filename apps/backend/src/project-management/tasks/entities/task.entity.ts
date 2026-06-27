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

  @Field(() => ID)
  @Column('uuid', { name: 'project_id' })
  projectId: string;

  @Field(() => Project, { nullable: true })
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Field(() => ID)
  @Column('uuid', { name: 'created_by_membership_id' })
  createdByMembershipId: string;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_membership_id' })
  createdBy?: Membership;

  @Field(() => [TaskAssignee], { nullable: true })
  @OneToMany(() => TaskAssignee, (assignee) => assignee.task)
  assignees?: TaskAssignee[];
}
