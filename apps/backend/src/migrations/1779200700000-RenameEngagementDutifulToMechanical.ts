import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renames the `DUTIFUL` enum value of `lesson_records_engagement_enum` to
 * `MECHANICAL` to better reflect Hattie's surface-engagement category.
 *
 * `ALTER TYPE ... RENAME VALUE` (PG10+) preserves existing rows automatically.
 */
export class RenameEngagementDutifulToMechanical1779200700000 implements MigrationInterface {
  name = 'RenameEngagementDutifulToMechanical1779200700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'lesson_records_engagement_enum'
            AND e.enumlabel = 'DUTIFUL'
        ) AND NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'lesson_records_engagement_enum'
            AND e.enumlabel = 'MECHANICAL'
        ) THEN
          ALTER TYPE "lesson_records_engagement_enum" RENAME VALUE 'DUTIFUL' TO 'MECHANICAL';
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'lesson_records_engagement_enum'
            AND e.enumlabel = 'MECHANICAL'
        ) AND NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'lesson_records_engagement_enum'
            AND e.enumlabel = 'DUTIFUL'
        ) THEN
          ALTER TYPE "lesson_records_engagement_enum" RENAME VALUE 'MECHANICAL' TO 'DUTIFUL';
        END IF;
      END$$;
    `);
  }
}
