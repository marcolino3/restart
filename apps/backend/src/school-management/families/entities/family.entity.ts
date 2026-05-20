import { Address } from '@/addresses/entities/address.entity';
import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { IFamily } from '../interfaces/family.interface';

@ObjectType()
@Entity('families')
@Index('idx_families_org', ['organizationId'])
export class Family extends AbstractEntity<Family> implements IFamily {
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  name?: string | null;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'primary_address_id', nullable: true })
  primaryAddressId?: string | null;

  @Field(() => Address, { nullable: true })
  @ManyToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'primary_address_id' })
  primaryAddress?: Address | null;

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
