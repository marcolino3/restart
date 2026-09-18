import { Field, ObjectType } from '@nestjs/graphql';
import { Column } from 'typeorm';

/** Organization-owned personal data, independent of the global login identity. */
@ObjectType()
export class EmployeeProfile {
  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_first_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  firstName?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_last_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  lastName?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_title',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  title?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'profile_date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_social_security_number',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  socialSecurityNumber?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_private_email',
    type: 'varchar',
    length: 320,
    nullable: true,
  })
  privateEmail?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_street',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  street?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_house_number',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  houseNumber?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_address_line_2',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  addressLine2?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_postal_code',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  postalCode?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_city',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  city?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_country',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  country?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_avatar_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  avatarUrl?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_language',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  language?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'profile_email',
    type: 'varchar',
    length: 320,
    nullable: true,
  })
  email?: string | null;
}
