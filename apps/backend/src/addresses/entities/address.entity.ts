import { Country } from '@/countries/entities/country.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { IAddress } from '@/addresses/interfaces/address.interface';
import { AbstractEntity } from '@/database/abstract.entity';

@ObjectType()
@Entity('addresses')
@Index('idx_addresses_org', ['organizationId'])
export class Address extends AbstractEntity<Address> implements IAddress {
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  street?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'house_number', nullable: true })
  houseNumber?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'address_line_2', nullable: true })
  addressLine2?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { name: 'postal_code', nullable: true })
  postalCode?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  city?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  state?: string;

  @Column('uuid', { name: 'country_id', nullable: true })
  countryId?: string | null;

  @Field(() => Country, { nullable: true })
  @ManyToOne(() => Country, { nullable: true })
  @JoinColumn({ name: 'country_id' })
  country?: Country;

  @Field(() => String)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;
}
