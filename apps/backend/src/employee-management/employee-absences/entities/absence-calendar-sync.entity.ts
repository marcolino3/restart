import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, HideField, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CalendarProvider } from './calendar-provider.enum';
import { EmployeeAbsence } from './employee-absence.entity';

/**
 * Tracks the external calendar event mirroring a single absence, so a later
 * extension can patch the existing event instead of creating a duplicate.
 * Calendar sync is best-effort: failures are recorded in `lastError` and never
 * abort the absence itself.
 */
@ObjectType()
@Entity('absence_calendar_syncs')
@Index(
  'uq_absence_calendar_syncs_absence_provider',
  ['absenceId', 'provider'],
  {
    unique: true,
  },
)
export class AbsenceCalendarSync extends AbstractEntity<AbsenceCalendarSync> {
  // Organization
  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  // Absence
  @ManyToOne(() => EmployeeAbsence, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'absence_id' })
  absence: EmployeeAbsence;

  @Field(() => ID)
  @Column('uuid', { name: 'absence_id' })
  absenceId: string;

  @Field(() => CalendarProvider)
  @Column('varchar', { length: 20, default: CalendarProvider.GOOGLE })
  provider: CalendarProvider;

  // Target calendar at sync time — internal routing detail, not exposed.
  @HideField()
  @Column('varchar', { name: 'calendar_id', length: 320 })
  calendarId: string;

  // Provider-side event id used for patch/delete — internal, not exposed.
  @HideField()
  @Column('varchar', { name: 'external_event_id', length: 1024 })
  externalEventId: string;

  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { name: 'last_synced_at', nullable: true })
  lastSyncedAt?: Date | null;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'last_error', nullable: true })
  lastError?: string | null;
}
