import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * "Wiedervorlage": optionales Schuljahr, für das eine abgelehnte Bewerbung auf
 * der Warteliste vorgemerkt wird. Freitext (z.B. "2027/28"), nullable.
 */
export class AddAdmissionFollowUpYear1783061030000 implements MigrationInterface {
  name = 'AddAdmissionFollowUpYear1783061030000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admission_applications" ADD COLUMN IF NOT EXISTS "follow_up_year" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admission_applications" DROP COLUMN IF EXISTS "follow_up_year"`,
    );
  }
}
