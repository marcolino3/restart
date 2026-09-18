import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountEmailChanges1789390000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE account_email_changes (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), auth_user_id text NOT NULL UNIQUE,
      user_email_id uuid NOT NULL REFERENCES user_emails(id) ON DELETE CASCADE,
      old_email varchar(320) NOT NULL, new_email varchar(320) NOT NULL,
      old_token_hash varchar(64) NOT NULL UNIQUE, new_token_hash varchar(64) NOT NULL UNIQUE,
      old_confirmed boolean NOT NULL DEFAULT false, new_confirmed boolean NOT NULL DEFAULT false,
      expires_at timestamptz NOT NULL
    )`);
  }
  down(): Promise<void> {
    return Promise.reject(
      new Error('Account email changes require a forward correction.'),
    );
  }
}
