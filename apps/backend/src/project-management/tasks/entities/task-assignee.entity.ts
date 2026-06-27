import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Task } from './task.entity';

@ObjectType()
@Entity('task_assignees')
@Index('UQ_task_assignee_task_membership', ['taskId', 'membershipId'], {
  unique: true,
})
@Index('idx_task_assignees_membership', ['membershipId'])
export class TaskAssignee extends AbstractEntity<TaskAssignee> {
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'task_id' })
  taskId: string;

  @Field(() => Task, { nullable: true })
  @ManyToOne(() => Task, (task) => task.assignees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Field(() => ID)
  @Column('uuid', { name: 'membership_id' })
  membershipId: string;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membership_id' })
  membership: Membership;
}
