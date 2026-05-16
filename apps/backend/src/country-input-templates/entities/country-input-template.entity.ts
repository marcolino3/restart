import { AbstractEntity } from '@/database/abstract.entity';
import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, Index, Unique } from 'typeorm';

export enum CountryInputFieldType {
  PHONE = 'PHONE',
  IBAN = 'IBAN',
  SSN = 'SSN',
  POSTAL_CODE = 'POSTAL_CODE',
}

registerEnumType(CountryInputFieldType, { name: 'CountryInputFieldType' });

export enum CountryInputValidatorKind {
  NONE = 'NONE',
  IBAN_MOD97 = 'IBAN_MOD97',
  CH_SSN = 'CH_SSN',
  REGEX = 'REGEX',
}

registerEnumType(CountryInputValidatorKind, {
  name: 'CountryInputValidatorKind',
});

@ObjectType()
@Entity('country_input_templates')
@Unique('uq_country_input_templates_country_field', [
  'countryCode',
  'fieldType',
])
@Index('idx_country_input_templates_field', ['fieldType'])
export class CountryInputTemplate extends AbstractEntity<CountryInputTemplate> {
  /** ISO-2 (CH, DE, …) oder '*' für globales Template. */
  @Field(() => String)
  @Column('varchar', { name: 'country_code', length: 10 })
  countryCode: string;

  @Field(() => CountryInputFieldType)
  @Column({
    name: 'field_type',
    type: 'enum',
    enum: CountryInputFieldType,
  })
  fieldType: CountryInputFieldType;

  @Field(() => String)
  @Column('varchar', { name: 'mask', length: 100 })
  mask: string;

  @Field(() => String, { nullable: true })
  @Column('varchar', { name: 'placeholder', length: 100, nullable: true })
  placeholder?: string | null;

  @Field(() => Int, { nullable: true })
  @Column('int', { name: 'max_length', nullable: true })
  maxLength?: number | null;

  @Field(() => String, { nullable: true })
  @Column('varchar', { name: 'regex', length: 500, nullable: true })
  regex?: string | null;

  @Field(() => String, { nullable: true })
  @Column('varchar', { name: 'prefix', length: 20, nullable: true })
  prefix?: string | null;

  @Field(() => CountryInputValidatorKind)
  @Column({
    name: 'validator_kind',
    type: 'enum',
    enum: CountryInputValidatorKind,
    default: CountryInputValidatorKind.NONE,
  })
  validatorKind: CountryInputValidatorKind;
}
