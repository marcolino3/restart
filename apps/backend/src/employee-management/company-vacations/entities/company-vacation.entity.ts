import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Betriebsferien / kollektive Schliessung. Wirkt nur für Mitarbeiter mit
 * expliziter Zuweisung (`CompanyVacationAssignment`).
 */
@ObjectType()
@Entity('company_vacations')
@Index('idx_company_vacations_org', ['organizationId'])
export class CompanyVacation extends AbstractEntity<CompanyVacation> {
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Field(() => String)
  @Column('varchar', { length: 200 })
  name!: string;

  @Field(() => String)
  @Column('date', { name: 'start_date' })
  startDate!: string;

  @Field(() => String)
  @Column('date', { name: 'end_date' })
  endDate!: string;

  /** Werktage (Mo–Fr) im Bereich minus Feiertage (anteilig nach paidPercentage); neu berechnet bei Vacation- oder Holiday-CRUD. */
  @Field(() => Float)
  @Column('numeric', {
    name: 'effective_days',
    precision: 5,
    scale: 1,
    default: 0,
  })
  effectiveDays!: number;
}
