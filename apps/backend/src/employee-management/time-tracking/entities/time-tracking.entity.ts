import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

export enum TimeTrackingSource {
  CLOCK = 'CLOCK', // live Start/Stop (Stempeluhr)
  MANUAL = 'MANUAL', // manuell eingetragene Zeiten
}

registerEnumType(TimeTrackingSource, { name: 'TimeTrackingSource' });

@ObjectType()
@Entity('time_tracking_entries')
@Index('IDX_time_tracking_employee_started', ['employeeId', 'startedAt'])
@Index('IDX_time_tracking_employee_entry_date', ['employeeId', 'entryDate'])
export class TimeTracking extends AbstractEntity<TimeTracking> {
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

  @Field(() => Date)
  @Column('timestamptz', { name: 'started_at' })
  startedAt: Date;

  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'ended_at', nullable: true })
  endedAt?: Date;

  @Field(() => Int, { nullable: true })
  @Column('integer', { name: 'break_minutes', nullable: true })
  breakMinutes?: number;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  notes?: string;

  // Kalendertag, dem der Eintrag zugeordnet ist (aus startedAt abgeleitet).
  // Für tagesweise Aggregation im Ledger; backfilled aus started_at.
  @Field(() => String)
  @Column('date', { name: 'entry_date' })
  entryDate: string;

  // Netto-Arbeitsminuten (ended - started - break). Beim Schreiben berechnet;
  // null solange ein Live-Eintrag noch offen ist (endedAt null).
  @Field(() => Int, { nullable: true })
  @Column('integer', { name: 'work_minutes', nullable: true })
  workMinutes?: number | null;

  @Field(() => TimeTrackingSource)
  @Column('enum', {
    enum: TimeTrackingSource,
    default: TimeTrackingSource.MANUAL,
  })
  source: TimeTrackingSource;
}
