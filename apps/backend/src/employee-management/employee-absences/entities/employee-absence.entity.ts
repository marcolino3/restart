import { EmployeeAbsenceCategory } from '@/employee-management/employee-absence-categories/entities/employee-absence-category.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { EmployeeAbsenceDay } from './employee-absence-days.entity';
import { AbsenceDocument } from './absence-document.type';
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
  @Field(() => EmployeeAbsenceCategory)
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
  @Field(() => Date)
  @Column('timestamptz')
  startDate: Date;

  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { nullable: true })
  endDate: Date;

  // Uhrzeit ab der die Absenz am startDate gilt ('HH:mm:ss'). NULL = ab Tagesbeginn
  // (ganztaegig). Gesetzt z. B. bei einer Krankmeldung ab Mittag.
  @Field(() => String, { nullable: true })
  @Column('time', { name: 'start_time', nullable: true })
  startTime?: string | null;

  // Uhrzeit bis zu der die Absenz am endDate gilt ('HH:mm:ss'). NULL = bis Tagesende.
  @Field(() => String, { nullable: true })
  @Column('time', { name: 'end_time', nullable: true })
  endTime?: string | null;

  // Nullable in the database, so it must be nullable in the schema too:
  // absences created without a note otherwise fail the whole query.
  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  note?: string;

  @Field(() => Boolean)
  @Column({ default: false })
  isTeamInformed: boolean;

  // Ferienfaehigkeit: false = ueberlappende Ferientage werden gutgeschrieben.
  // Initial aus EmployeeAbsenceCategory.defaultIsVacationCapable; pro Fall ueberschreibbar.
  @Field(() => Boolean)
  @Column('boolean', { name: 'is_vacation_capable', default: true })
  isVacationCapable: boolean;

  // Abwesenheitsgrad in Prozent (1–100). 100 = ganztägig; <100 = Teilabsenz
  // (z. B. 50 % AU). Initial aus EmployeeAbsenceCategory.defaultPercentage.
  @Field(() => Int)
  @Column('int', { default: 100 })
  percentage: number;

  // Arztzeugnisse (private Storage-URLs via /api/absence-certificates/…).
  @Field(() => [AbsenceDocument])
  @Column('jsonb', { default: [] })
  certificates: AbsenceDocument[];

  // Weitere Dokumente (z. B. Unfallmeldung) — gleicher Storage wie Arztzeugnis.
  @Field(() => [AbsenceDocument])
  @Column('jsonb', { name: 'additional_documents', default: [] })
  additionalDocuments: AbsenceDocument[];
}
