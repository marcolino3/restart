import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

export enum TimeTrackingPeriodStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
}

registerEnumType(TimeTrackingPeriodStatus, {
  name: 'TimeTrackingPeriodStatus',
});

/**
 * Abrechnungsperiode, abgeleitet aus dem org-konfigurierten Stichtag
 * (Org-Setting TIMETRACKING_PERIOD_ANCHOR, MM-DD). Ersetzt das colibri-Schuljahr.
 * `LOCKED` sperrt Erfassung/Änderungen innerhalb der Periode.
 */
@ObjectType()
@Entity('time_tracking_periods')
@Unique('uq_time_tracking_periods_org_start', ['organizationId', 'startDate'])
@Index('idx_time_tracking_periods_org', ['organizationId'])
export class TimeTrackingPeriod extends AbstractEntity<TimeTrackingPeriod> {
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Field(() => String)
  @Column('varchar', { length: 50 })
  label!: string;

  @Field(() => String)
  @Column('date', { name: 'start_date' })
  startDate!: string;

  @Field(() => String)
  @Column('date', { name: 'end_date' })
  endDate!: string;

  @Field(() => TimeTrackingPeriodStatus)
  @Column('enum', {
    enum: TimeTrackingPeriodStatus,
    default: TimeTrackingPeriodStatus.OPEN,
  })
  status!: TimeTrackingPeriodStatus;
}
