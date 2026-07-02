import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * Betriebsferien / kollektive Schliessung (gilt org-weit).
 * v1: `appliesToAll`. Team-/MA-spezifisches Scoping folgt in v2.
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

  @Field(() => Boolean)
  @Column('boolean', { name: 'applies_to_all', default: true })
  appliesToAll!: boolean;
}
