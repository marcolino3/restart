import { Country } from '@/countries/entities/country.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { IAddress } from '@/addresses/interfaces/address.interface';
import { AbstractEntity } from '@/database/abstract.entity';

@ObjectType()
@Entity()
export class Address extends AbstractEntity<Address> implements IAddress {
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  addressLine1?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  addressLine2?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  postalCode?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  city?: string;

  @Field(() => Country, { nullable: true })
  @ManyToOne(() => Country, { nullable: true })
  @JoinColumn()
  country?: Country;
}
