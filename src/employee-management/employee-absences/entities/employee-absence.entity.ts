import { EmployeeAbsenceCategory } from '@/employee-management/employee-absence-categories/entities/employee-absence-category.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { EmployeeAbsenceDay } from './employee-absence-days.entity';
import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Membership } from '@/memberships/entities/membership.entity';

@ObjectType()
@Entity('employee_absences')
export class EmployeeAbsence extends AbstractEntity<EmployeeAbsence> {
  // Organization
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  // Membership
  @ManyToOne(() => Membership, { nullable: false })
  @JoinColumn({ name: 'membership_id' })
  membership: Membership;

  @Field(() => String)
  @Column('uuid', { name: 'membership_id' })
  membershipId: string;

  // Employee
  @Field(() => Employee)
  @ManyToOne(() => Employee, (employee) => employee.absences)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Field(() => String)
  @Column('uuid', { name: 'employee_id' })
  employeeId: string;

  // Absence Category
  @ManyToOne(() => EmployeeAbsenceCategory)
  @JoinColumn({ name: 'absence_category_id' })
  absenceCategory: EmployeeAbsenceCategory;

  @Field(() => String)
  @Column('uuid', { name: 'absence_category_id' })
  absenceCategoryId: string;

  // Employee Absence Days
  @Field(() => [EmployeeAbsenceDay], { nullable: true })
  @OneToMany(
    () => EmployeeAbsenceDay,
    (employeeAbsenceDay) => employeeAbsenceDay.employeeAbsence,
    { nullable: true, cascade: true },
  )
  absenceDays: EmployeeAbsenceDay[];

  // Data
  @Field(() => String)
  @Column('timestamptz')
  startDate: Date;

  @Field(() => String, { nullable: true })
  @Column('timestamptz', { nullable: true })
  endDate: Date;

  @Field(() => String)
  @Column({ nullable: true })
  note?: string;

  @Field(() => Boolean)
  @Column({ default: false })
  isTeamInformed: boolean;
}
