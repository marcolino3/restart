import { ObjectType, Field, HideField } from '@nestjs/graphql';
import { Column, Entity, OneToMany, Index } from 'typeorm';
import { AbstractEntity } from '@/database/abstract.entity';
import { Membership } from '@/memberships/entities/membership.entity';

@ObjectType()
@Entity('users')
@Index('uq_users_email', ['email'], { unique: true })
@Index('uq_users_username', ['username'], {
  unique: true,
  where: '"username" IS NOT NULL',
})
export class User extends AbstractEntity<User> {
  @Field(() => String)
  @Column({ name: 'first_name', type: 'varchar', length: 120 })
  firstName!: string;

  @Field(() => String)
  @Column({ name: 'last_name', type: 'varchar', length: 120 })
  lastName!: string;

  @Field(() => String)
  @Column('text', { unique: true })
  email!: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  username?: string | null;

  // Nicht im GraphQL-Schema exponieren
  @HideField()
  @Column({ name: 'password_hash', type: 'text', select: false })
  passwordHash!: string;

  @HideField()
  @Column({
    name: 'refresh_token',
    type: 'text',
    select: false,
    nullable: true,
  })
  refreshToken: string | null;

  // Optionales externes Login, ebenfalls verbergen
  @HideField()
  @Column({
    name: 'google_id',
    type: 'varchar',
    length: 64,
    select: false,
    nullable: true,
  })
  googleId?: string | null;

  @Field(() => [Membership])
  @OneToMany(() => Membership, (membership) => membership.user)
  memberships!: Membership[];

  @Field(() => Boolean, { nullable: true })
  @Column({ name: 'is_super_admin', type: 'boolean', default: false })
  isSuperAdmin!: boolean;
}
