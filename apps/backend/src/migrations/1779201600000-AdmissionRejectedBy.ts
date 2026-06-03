import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdmissionRejectedBy1779201600000 implements MigrationInterface {
  name = 'AdmissionRejectedBy1779201600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Who initiated the rejection: SCHOOL | PARENTS | OTHER (nullable).
    await queryRunner.query(
      `ALTER TABLE "admission_applications" ADD COLUMN IF NOT EXISTS "rejected_by" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admission_applications" DROP COLUMN IF EXISTS "rejected_by"`,
    );
  }
}
