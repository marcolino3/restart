import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Track which user created a time tracking entry.
 * Nullable: pre-existing rows have no known creator.
 */
export class AddTimeTrackingCreatedBy1786024976000 implements MigrationInterface {
  name = 'AddTimeTrackingCreatedBy1786024976000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" ADD COLUMN IF NOT EXISTS "created_by_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" ADD CONSTRAINT "FK_time_tracking_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" DROP CONSTRAINT IF EXISTS "FK_time_tracking_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_tracking_entries" DROP COLUMN IF EXISTS "created_by_id"`,
    );
  }
}
