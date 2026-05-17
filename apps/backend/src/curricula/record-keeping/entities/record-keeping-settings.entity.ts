import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';

/**
 * Per-organization thresholds for the per-student attention heuristics
 * (see `derive-attention-items.ts` on the web side). One row per org,
 * created on first save — service falls back to defaults until then.
 */
@ObjectType()
@Entity('record_keeping_settings')
@Index('uq_record_keeping_settings_org', ['organizationId'], { unique: true })
export class RecordKeepingSettings extends AbstractEntity<RecordKeepingSettings> {
  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  /** Days an INTRODUCED lesson may sit before it counts as "stuck". */
  @Field(() => Int)
  @Column('int', { name: 'introduced_stuck_days', default: 30 })
  introducedStuckDays: number;

  /** Days a PRACTICED lesson may sit before it counts as "stuck". */
  @Field(() => Int)
  @Column('int', { name: 'practiced_stuck_days', default: 90 })
  practicedStuckDays: number;

  /** Historic gap (intro → practiced) that flags a "big jump". */
  @Field(() => Int)
  @Column('int', { name: 'big_gap_days', default: 60 })
  bigGapDays: number;
}
