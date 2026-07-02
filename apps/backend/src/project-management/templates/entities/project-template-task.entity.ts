import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { TaskPriority } from '@/project-management/tasks/entities/task-priority.enum';
import { SystemRole } from '@/roles/entities/system-role.enum';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ProjectTemplate } from './project-template.entity';

@ObjectType()
@Entity('project_template_tasks')
@Index('idx_project_template_tasks_template', ['templateId'])
export class ProjectTemplateTask extends AbstractEntity<ProjectTemplateTask> {
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'template_id' })
  templateId: string;

  @Field(() => ProjectTemplate, { nullable: true })
  @ManyToOne(() => ProjectTemplate, (template) => template.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_id' })
  template: ProjectTemplate;

  @Field(() => String)
  @Column('text')
  title: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  description?: string | null;

  @Field(() => TaskPriority)
  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Field(() => Int)
  @Column('integer', { name: 'sort_order', default: 0 })
  sortOrder: number;

  // Relative due date in days from the project's start date when instantiated.
  @Field(() => Int, { nullable: true })
  @Column('integer', { name: 'due_offset_days', nullable: true })
  dueOffsetDays?: number | null;

  // Stored intent only — automatic mapping of a role to concrete project
  // members on instantiation is a later iteration.
  @Field(() => SystemRole, { nullable: true })
  @Column({
    name: 'default_assignee_role',
    type: 'enum',
    enum: SystemRole,
    nullable: true,
  })
  defaultAssigneeRole?: SystemRole | null;
}
