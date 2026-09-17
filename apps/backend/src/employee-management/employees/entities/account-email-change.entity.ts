import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('account_email_changes')
export class AccountEmailChange {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index({ unique: true })
  @Column('text', { name: 'auth_user_id' })
  authUserId!: string;
  @Column('uuid', { name: 'user_email_id' }) userEmailId!: string;
  @Column('varchar', { name: 'old_email', length: 320 }) oldEmail!: string;
  @Column('varchar', { name: 'new_email', length: 320 }) newEmail!: string;
  @Index({ unique: true })
  @Column('varchar', { name: 'old_token_hash', length: 64 })
  oldTokenHash!: string;
  @Index({ unique: true })
  @Column('varchar', { name: 'new_token_hash', length: 64 })
  newTokenHash!: string;
  @Column('boolean', { name: 'old_confirmed', default: false })
  oldConfirmed!: boolean;
  @Column('boolean', { name: 'new_confirmed', default: false })
  newConfirmed!: boolean;
  @Column('timestamptz', { name: 'expires_at' }) expiresAt!: Date;
}
