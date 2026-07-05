import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

/**
 * A subprocessor / data processor the org relies on (Auftragsverarbeiter,
 * DSGVO Art. 28). `dpaSigned` records that an AVV/DPA is in place. Feeds the
 * public privacy policy's subprocessor list.
 */
@ObjectType()
@Entity('subprocessors')
@Index('idx_subprocessors_org', ['organizationId'])
export class Subprocessor extends AbstractEntity<Subprocessor> {
  @Field(() => String)
  @Column('text')
  name: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  purpose?: string | null;

  /** Where the processor stores/handles the data (country / region). */
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  country?: string | null;

  /** Whether a data-processing agreement (AVV/DPA) has been signed. */
  @Field(() => Boolean)
  @Column('boolean', { name: 'dpa_signed', default: false })
  dpaSigned: boolean;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  url?: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  notes?: string | null;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
