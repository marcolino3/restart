import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Org-wide work shift (e.g. "Frühschicht 07:00–12:00"). Shifts are assigned to
 * teams via `team_shifts`; coverage requirements and plans (later phases)
 * reference them. Times are wall-clock `HH:MM` in the org's timezone; a shift
 * may cross midnight (end < start).
 */
@ObjectType()
@Entity('shifts')
@Index('UQ_shift_org_name', ['organizationId', 'name'], { unique: true })
export class Shift extends AbstractEntity<Shift> {
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Field(() => String)
  @Column('varchar', { length: 120 })
  name!: string;

  /** `HH:MM` (Postgres `time`; seconds are dropped by the service). */
  @Field(() => String)
  @Column('time', { name: 'start_time' })
  startTime!: string;

  @Field(() => String)
  @Column('time', { name: 'end_time' })
  endTime!: string;

  /** Hex `#RRGGBB` for chips/grids; null = neutral. */
  @Field(() => String, { nullable: true })
  @Column('varchar', { length: 7, nullable: true })
  color?: string | null;

  @Field(() => Int)
  @Column('integer', { name: 'sort_order', default: 0 })
  sortOrder!: number;
}
