import { ObjectType, Field, ID, HideField } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '@/database/abstract.entity';
import { User } from '@/users/entities/user.entity';
import { AuthAccount } from '@/auth-accounts/entities/auth-account.entity';

@ObjectType()
@Entity('user_emails')
@Index('uq_user_emails_email', ['email'], { unique: true })
export class UserEmail extends AbstractEntity<UserEmail> {
  @Field(() => ID)
  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.userEmails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Field(() => String)
  @Column('text')
  email!: string;

  @Field(() => Boolean)
  @Column('boolean', { name: 'is_primary', default: false })
  isPrimary!: boolean;

  @Field(() => Boolean)
  @Column('boolean', { name: 'is_verified', default: false })
  isVerified!: boolean;

  @HideField()
  @Column({ name: 'password_hash', type: 'text', select: false, nullable: true })
  passwordHash?: string | null;

  @HideField()
  @Column({
    name: 'magic_link_token',
    type: 'text',
    select: false,
    nullable: true,
  })
  magicLinkToken?: string | null;

  @HideField()
  @Column({
    name: 'magic_link_expires_at',
    type: 'timestamptz',
    select: false,
    nullable: true,
  })
  magicLinkExpiresAt?: Date | null;

  @Field(() => [AuthAccount], { nullable: true })
  @OneToMany(() => AuthAccount, (aa) => aa.userEmail)
  authAccounts?: AuthAccount[];
}
