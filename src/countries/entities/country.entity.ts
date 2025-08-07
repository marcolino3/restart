import { AbstractEntity } from '@/database/abstract.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { ICountry } from '@/countries/interfaces/country.interface';
import { Column, Entity } from 'typeorm';

@ObjectType()
@Entity()
export class Country extends AbstractEntity<Country> implements ICountry {
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  isoCode: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  currency: string;
}
