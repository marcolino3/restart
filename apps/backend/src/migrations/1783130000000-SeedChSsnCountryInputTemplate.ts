import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * No country_input_templates row ever existed for CH/SSN, so the AHV-Nummer
 * field always rendered without a mask/placeholder regardless of the
 * employee's country. AHV format: 756.XXXX.XXXX.XX (13 digits, EAN-13 style).
 */
export class SeedChSsnCountryInputTemplate1783130000000 implements MigrationInterface {
  name = 'SeedChSsnCountryInputTemplate1783130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "country_input_templates"
        ("version", "country_code", "field_type", "mask", "placeholder", "max_length", "prefix", "validator_kind")
      VALUES
        (1, 'CH', 'SSN', '999.9999.9999.99', '756.XXXX.XXXX.XX', 16, '756.', 'CH_SSN')
      ON CONFLICT ("country_code", "field_type") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "country_input_templates"
      WHERE "country_code" = 'CH' AND "field_type" = 'SSN'
    `);
  }
}
