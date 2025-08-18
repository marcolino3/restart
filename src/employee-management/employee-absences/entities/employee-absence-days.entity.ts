import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EmployeeAbsence } from './employee-absence.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AbstractEntity } from '@/database/abstract.entity';
import { EmployeeAbsenceCategory } from '@/employee-management/employee-absence-categories/entities/employee-absence-category.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';

@ObjectType()
@Entity('employee_absence_days')
export class EmployeeAbsenceDay extends AbstractEntity<EmployeeAbsenceDay> {
  // Employee Absence
  @Field(() => EmployeeAbsence)
  @ManyToOne(
    () => EmployeeAbsence,
    (employeeAbsence) => employeeAbsence.absenceDays,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'employee_absence_id' })
  employeeAbsence: EmployeeAbsence;

  @Field(() => ID)
  @Column('uuid', { name: 'employee_absence_id' })
  employeeAbsenceId: string;

  // Employee Absence Category
  @Field(() => EmployeeAbsenceCategory, { nullable: true })
  @ManyToOne(() => EmployeeAbsenceCategory, { nullable: true })
  @JoinColumn({ name: 'absence_category_id' })
  absenceCategory: EmployeeAbsenceCategory;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'absence_category_id', nullable: true })
  absenceCategoryId: string;

  // Employee
  @Field(() => Employee)
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Field(() => ID)
  @Column('uuid', { name: 'employee_id' })
  employeeId: string;

  // Organization
  @Field(() => Organization)
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  // Date
  @Field(() => Date)
  @Column('timestamptz')
  date: Date;
}
