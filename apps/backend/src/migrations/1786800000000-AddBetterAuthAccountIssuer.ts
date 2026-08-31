import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * better-auth 1.7 scopes account identity by `issuer`: the `account` table gains
 * a NOT NULL `issuer` column paired with `accountId` in a unique index.
 *
 * better-auth's own schema runner (`src/migrate-auth.ts`) refuses to add this
 * column on a populated table — a required column with no default would leave
 * existing rows without a value (`UnsafeMigrationError`). So the expand step
 * lives here instead: add nullable, backfill, then enforce NOT NULL.
 *
 * Backfill values mirror what better-auth writes at runtime — verified against
 * `createLocalAccountIssuer` / `createOAuthAccountIssuer` in @better-auth/core:
 *   - credential accounts     -> `local:credential`
 *   - social provider accounts -> `local:oauth:<providerId>`
 * Both apply because no `accountIssuer` is configured for the social providers
 * in `src/lib/auth.ts`; configuring one later requires a follow-up backfill.
 *
 * On a fresh database `CreateBetterAuthTables` creates `account` in its pre-1.7
 * shape and this migration upgrades it, so a fresh DB ends up identical to a
 * migrated one. The steps are still guarded on the table existing, so the
 * migration stays correct if the auth tables ever move out of the TypeORM
 * migrations and are created by `auth:migrate` afterwards instead.
 */
export class AddBetterAuthAccountIssuer1786800000000 implements MigrationInterface {
  name = 'AddBetterAuthAccountIssuer1786800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ exists }] = (await queryRunner.query(
      `SELECT to_regclass('public.account') IS NOT NULL AS exists`,
    )) as [{ exists: boolean }];
    if (!exists) return;

    await queryRunner.query(
      `ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" text`,
    );
    await queryRunner.query(
      `UPDATE "account" SET "issuer" = 'local:credential'
        WHERE "providerId" = 'credential' AND "issuer" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "account" SET "issuer" = 'local:oauth:' || "providerId"
        WHERE "providerId" <> 'credential' AND "issuer" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "account_issuer_account_id_uidx"
        ON "account" ("issuer", "accountId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const [{ exists }] = (await queryRunner.query(
      `SELECT to_regclass('public.account') IS NOT NULL AS exists`,
    )) as [{ exists: boolean }];
    if (!exists) return;

    await queryRunner.query(
      `DROP INDEX IF EXISTS "account_issuer_account_id_uidx"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN IF EXISTS "issuer"`,
    );
  }
}
