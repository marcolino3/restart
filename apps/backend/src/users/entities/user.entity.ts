import { ObjectType, Field, HideField } from '@nestjs/graphql';
import { Column, Entity, OneToMany, Index } from 'typeorm';
import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';

@ObjectType()
@Entity('users')
@Index('uq_users_username', ['username'], {
  unique: true,
  where: '"username" IS NOT NULL',
})
export class User extends AbstractEntity<User> {
  @Field(() => String, { nullable: true })
  @Column({ name: 'title', type: 'varchar', length: 20, nullable: true })
  title?: string | null;

  @Field(() => String)
  @Column({ name: 'first_name', type: 'varchar', length: 120 })
  firstName!: string;

  @Field(() => String)
  @Column({ name: 'last_name', type: 'varchar', length: 120 })
  lastName!: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  username?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'social_security_number',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  socialSecurityNumber?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'street', type: 'varchar', length: 200, nullable: true })
  street?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'house_number', type: 'varchar', length: 30, nullable: true })
  houseNumber?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'address_line_2', type: 'varchar', length: 200, nullable: true })
  addressLine2?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'city', type: 'varchar', length: 120, nullable: true })
  city?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'country', type: 'varchar', length: 80, nullable: true })
  country?: string | null;

  @HideField()
  @Column({
    name: 'refresh_token',
    type: 'text',
    select: false,
    nullable: true,
  })
  refreshToken: string | null;

  @Field(() => [UserEmail])
  @OneToMany(() => UserEmail, (ue) => ue.user)
  userEmails!: UserEmail[];

  @Field(() => [Membership])
  @OneToMany(() => Membership, (membership) => membership.user)
  memberships!: Membership[];

  @Field(() => Boolean, { nullable: true })
  @Column({ name: 'is_super_admin', type: 'boolean', default: false })
  isSuperAdmin!: boolean;
}
