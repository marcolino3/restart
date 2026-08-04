import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';

/**
 * Org-spezifischer Feiertag des Arbeitskalenders.
 * `paidPercentage` erlaubt teilbezahlte Feiertage (z. B. 50 %).
 */
@ObjectType()
@Entity('holidays')
@Unique('uq_holidays_org_date', ['organizationId', 'date'])
@Index('idx_holidays_org_date', ['organizationId', 'date'])
export class Holiday extends AbstractEntity<Holiday> {
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Field(() => String)
  @Column('date')
  date!: string;

  @Field(() => String)
  @Column('varchar', { length: 200 })
  name!: string;

  // 0–100; reduziert die Sollzeit dieses Tages entsprechend (100 = voll bezahlt frei).
  @Field(() => Int)
  @Column('int', { name: 'paid_percentage', default: 100 })
  paidPercentage!: number;

  /** Gilt jedes Jahr am gleichen Monat/Tag (Ankerdatum in `date`). */
  @Field(() => Boolean)
  @Column('boolean', { name: 'repeats_yearly', default: false })
  repeatsYearly!: boolean;
}
