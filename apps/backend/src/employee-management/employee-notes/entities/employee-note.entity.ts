import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EmployeeNoteCategory } from '../interfaces/employee-note-category.enum';

@ObjectType()
@Entity('employee_notes')
export class EmployeeNote extends AbstractEntity<EmployeeNote> {
  // Employee
  @Field(() => ID)
  @Column('uuid', { name: 'employee_id' })
  employeeId: string;

  @Field(() => Employee)
  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  // Organization
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // Author (Membership who created the note, nullable for SuperAdmins)
  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'author_membership_id', nullable: true })
  authorMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_membership_id' })
  authorMembership?: Membership | null;

  // Category
  @Field(() => EmployeeNoteCategory)
  @Column({
    name: 'category',
    type: 'enum',
    enum: EmployeeNoteCategory,
    default: EmployeeNoteCategory.GENERAL,
  })
  category: EmployeeNoteCategory;

  // Title
  @Field(() => String)
  @Column({ name: 'title', type: 'varchar', length: 200 })
  title: string;

  // Content
  @Field(() => String)
  @Column({ name: 'content', type: 'text' })
  content: string;

  // Confidential flag
  @Field(() => Boolean)
  @Column({ name: 'is_confidential', type: 'boolean', default: false })
  isConfidential: boolean;

  // Date (when the event happened)
  @Field(() => String)
  @Column({ name: 'date', type: 'date' })
  date: string;
}
