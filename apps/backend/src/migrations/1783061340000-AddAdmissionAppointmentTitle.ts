import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Free-text `title` on admission appointments — used when no appointment type
 * is set (or as an extra label alongside the type). Forward-only / additive.
 */
export class AddAdmissionAppointmentTitle1783061340000 implements MigrationInterface {
  name = 'AddAdmissionAppointmentTitle1783061340000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admission_appointments"
        ADD COLUMN IF NOT EXISTS "title" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admission_appointments" DROP COLUMN IF EXISTS "title"`,
    );
  }
}
