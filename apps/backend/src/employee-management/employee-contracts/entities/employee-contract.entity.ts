import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

export enum EmployeeContractType {
  PERMANENT = 'PERMANENT',
  TEMPORARY = 'TEMPORARY',
  HOURLY = 'HOURLY',
  INTERNSHIP = 'INTERNSHIP',
  APPRENTICESHIP = 'APPRENTICESHIP',
}

registerEnumType(EmployeeContractType, { name: 'EmployeeContractType' });

export enum EmployeePaymentInterval {
  MONTHLY_X12 = 'MONTHLY_X12',
  MONTHLY_X13 = 'MONTHLY_X13',
}

registerEnumType(EmployeePaymentInterval, { name: 'EmployeePaymentInterval' });

@ObjectType()
export class WeekdayWorkloads {
  @Field(() => Float, { nullable: true })
  mon?: number | null;
  @Field(() => Float, { nullable: true })
  tue?: number | null;
  @Field(() => Float, { nullable: true })
  wed?: number | null;
  @Field(() => Float, { nullable: true })
  thu?: number | null;
  @Field(() => Float, { nullable: true })
  fri?: number | null;
  @Field(() => Float, { nullable: true })
  sat?: number | null;
  @Field(() => Float, { nullable: true })
  sun?: number | null;
}

// A single working time window within a day, "HH:mm" 24h format.
@ObjectType()
export class TimeWindow {
  @Field(() => String)
  start: string;
  @Field(() => String)
  end: string;
}

// Concrete working time windows per weekday. When present, the work-time
// engine derives the daily planned minutes from the summed window durations
// (takes precedence over weekdayWorkloads / weeklyHours). null → fall back to
// weekdayWorkloads, then to an even Mon–Fri split of weeklyHours.
@ObjectType()
export class WeekdayTimeWindows {
  @Field(() => [TimeWindow], { nullable: true })
  mon?: TimeWindow[] | null;
  @Field(() => [TimeWindow], { nullable: true })
  tue?: TimeWindow[] | null;
  @Field(() => [TimeWindow], { nullable: true })
  wed?: TimeWindow[] | null;
  @Field(() => [TimeWindow], { nullable: true })
  thu?: TimeWindow[] | null;
  @Field(() => [TimeWindow], { nullable: true })
  fri?: TimeWindow[] | null;
  @Field(() => [TimeWindow], { nullable: true })
  sat?: TimeWindow[] | null;
  @Field(() => [TimeWindow], { nullable: true })
  sun?: TimeWindow[] | null;
}

@ObjectType()
@Entity('employee_contracts')
export class EmployeeContract extends AbstractEntity<EmployeeContract> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => String)
  @Column('uuid', { name: 'employee_id' })
  employeeId: string;

  @Field(() => Employee, { nullable: true })
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  // --- Vertragslaufzeit ---
  @Field(() => String)
  @Column('date', { name: 'start_date' })
  startDate: string;

  @Field(() => String, { nullable: true })
  @Column('date', { name: 'end_date', nullable: true })
  endDate?: string | null;

  @Field(() => String, { nullable: true })
  @Column('date', { name: 'probation_end_date', nullable: true })
  probationEndDate?: string | null;

  // --- Vertragsart / Funktion ---
  @Field(() => EmployeeContractType, { nullable: true })
  @Column({
    name: 'contract_type',
    type: 'enum',
    enum: EmployeeContractType,
    nullable: true,
  })
  contractType?: EmployeeContractType | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'position', type: 'varchar', length: 200, nullable: true })
  position?: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'supervisor_membership_id', nullable: true })
  supervisorMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'supervisor_membership_id' })
  supervisor?: Membership | null;

  // --- Arbeitszeit ---
  @Field(() => Float, { nullable: true })
  @Column('numeric', {
    name: 'workload_percent',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  workloadPercent?: number | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'weekly_hours',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  weeklyHours?: string | null;

  // Ungleiche Teilzeit: Pensum pro Wochentag in Prozent
  // { mon, tue, wed, thu, fri, sat, sun }. null = gleichmässige Verteilung
  // von workloadPercent auf Mo–Fr (colibri pensumMonday..Sunday).
  @Field(() => WeekdayWorkloads, { nullable: true })
  @Column('jsonb', { name: 'weekday_workloads', nullable: true })
  weekdayWorkloads?: WeekdayWorkloads | null;

  // Concrete working time windows per weekday (Mo 08:00–12:00, …). When set,
  // this is the source of truth for the daily planned minutes; see
  // WeekdayTimeWindows above and work-time-calculation.ts::dailyPlannedMinutes.
  @Field(() => WeekdayTimeWindows, { nullable: true })
  @Column('jsonb', { name: 'weekday_time_windows', nullable: true })
  weekdayTimeWindows?: WeekdayTimeWindows | null;

  // --- Lohn ---
  @Field(() => Float, { nullable: true })
  @Column('numeric', {
    name: 'gross_salary',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  grossSalary?: number | null;

  @Field(() => EmployeePaymentInterval, { nullable: true })
  @Column({
    name: 'payment_interval',
    type: 'enum',
    enum: EmployeePaymentInterval,
    nullable: true,
  })
  paymentInterval?: EmployeePaymentInterval | null;

  @Field(() => Boolean, { nullable: true })
  @Column({ name: 'has_13th_salary', type: 'boolean', nullable: true })
  has13thSalary?: boolean | null;

  // --- Ferien ---
  @Field(() => Int, { nullable: true })
  @Column({ name: 'annual_vacation_days', type: 'int', nullable: true })
  annualVacationDays?: number | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'remaining_vacation_days',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  remainingVacationDays?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  notes?: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'previous_contract_id', nullable: true })
  previousContractId?: string | null;

  @Field(() => EmployeeContract, { nullable: true })
  @ManyToOne(() => EmployeeContract, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'previous_contract_id' })
  previousContract?: EmployeeContract | null;
}
