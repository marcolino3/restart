import { MigrationInterface, QueryRunner } from 'typeorm';

/** Better Auth >=1.7.3 no longer writes issuer. Retain historical values. */
export class RelaxBetterAuthAccountIssuer1789720000000 implements MigrationInterface {
  name = 'RelaxBetterAuthAccountIssuer1789720000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('account', 'issuer'))) return;
    await queryRunner.query(
      `ALTER TABLE "account" ALTER COLUMN "issuer" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('account', 'issuer'))) return;
    // Restore the previous local-provider mapping before enforcing NOT NULL.
    await queryRunner.query(`UPDATE "account"
      SET "issuer" = CASE WHEN "providerId" = 'credential'
        THEN 'local:credential' ELSE 'local:oauth:' || "providerId" END
      WHERE "issuer" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL`,
    );
  }
}
