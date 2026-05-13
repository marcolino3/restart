import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@/database/abstract.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import { AuthProvider } from '../interfaces/auth-provider.enum';

@ObjectType()
@Entity('auth_accounts')
@Index('uq_auth_provider_id', ['provider', 'providerId'], { unique: true })
export class AuthAccount extends AbstractEntity<AuthAccount> {
  @Field(() => ID)
  @Column('uuid', { name: 'user_email_id' })
  userEmailId!: string;

  @Field(() => UserEmail)
  @ManyToOne(() => UserEmail, (ue) => ue.authAccounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_email_id' })
  userEmail!: UserEmail;

  @Field(() => AuthProvider)
  @Column({ type: 'enum', enum: AuthProvider })
  provider!: AuthProvider;

  @Field(() => String)
  @Column({ name: 'provider_id', type: 'varchar', length: 255 })
  providerId!: string;
}
