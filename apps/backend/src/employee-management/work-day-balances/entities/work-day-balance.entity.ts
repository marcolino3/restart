import { AbstractEntity } from '@/database/abstract.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, Unique } from 'typeorm';

/**
 * Materialisiertes Tages-Ledger: das vorberechnete Berechnungsergebnis der
 * Engine für genau einen (Mitarbeiter, Tag). Kern des Performance-Konzepts —
 * Auswertungen/Salden lesen per SUM/GROUP BY hieraus, ohne die Engine erneut
 * laufen zu lassen. Wird bei Mutationen gezielt (betroffene ISO-Wochen) per
 * Upsert neu geschrieben.
 *
 * Reine Ableitung aus TimeTracking/EmployeeAbsence/EmployeeVacation/
 * CompanyVacation/Holiday/EmployeeContract — niemals direkt vom Nutzer editiert.
 */
@ObjectType()
@Entity('work_day_balances')
@Unique('uq_work_day_balance_employee_date', ['employeeId', 'date'])
@Index('idx_work_day_balance_org_emp_date', [
  'organizationId',
  'employeeId',
  'date',
])
export class WorkDayBalance extends AbstractEntity<WorkDayBalance> {
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @Field(() => ID)
  @Column('uuid', { name: 'employee_id' })
  employeeId!: string;

  @Field(() => String)
  @Column('date')
  date!: string;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'contract_id', nullable: true })
  contractId!: string | null;

  // --- Minuten-Aggregate ---
  @Field(() => Int)
  @Column('int', { name: 'planned_minutes', default: 0 })
  plannedMinutes!: number;

  @Field(() => Int)
  @Column('int', { name: 'worked_minutes', default: 0 })
  workedMinutes!: number;

  @Field(() => Int)
  @Column('int', { name: 'vacation_minutes', default: 0 })
  vacationMinutes!: number;

  @Field(() => Int)
  @Column('int', { name: 'absence_minutes', default: 0 })
  absenceMinutes!: number;

  // worked + vacation + (anrechenbare) absence
  @Field(() => Int)
  @Column('int', { name: 'actual_minutes', default: 0 })
  actualMinutes!: number;

  // actual - planned, nach Überzeit-Cap
  @Field(() => Int)
  @Column('int', { name: 'difference_minutes', default: 0 })
  differenceMinutes!: number;

  @Field(() => Int)
  @Column('int', { name: 'capped_minutes', default: 0 })
  cappedMinutes!: number;

  // --- Tages-Klassifikation ---
  @Field(() => Boolean)
  @Column('boolean', { name: 'is_weekend', default: false })
  isWeekend!: boolean;

  @Field(() => Boolean)
  @Column('boolean', { name: 'is_holiday', default: false })
  isHoliday!: boolean;

  @Field(() => Boolean)
  @Column('boolean', { name: 'is_vacation', default: false })
  isVacation!: boolean;

  @Field(() => Boolean)
  @Column('boolean', { name: 'is_absence', default: false })
  isAbsence!: boolean;

  @Field(() => Boolean)
  @Column('boolean', { name: 'is_free_day', default: false })
  isFreeDay!: boolean;

  @Field(() => Boolean)
  @Column('boolean', { name: 'is_no_contract', default: false })
  isNoContract!: boolean;

  @Field(() => Boolean)
  @Column('boolean', { name: 'overtime_capped', default: false })
  overtimeCapped!: boolean;

  @Field(() => Date)
  @Column('timestamptz', { name: 'computed_at' })
  computedAt!: Date;
}
