import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CH phone and postal-code fields rendered without masks when no
 * country_input_templates rows exist for CH/PHONE and CH/POSTAL_CODE.
 */
export class SeedChPhoneAndPostalCodeCountryInputTemplates1783140000000 implements MigrationInterface {
  name = 'SeedChPhoneAndPostalCodeCountryInputTemplates1783140000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "country_input_templates"
        ("version", "country_code", "field_type", "mask", "placeholder", "max_length", "prefix", "validator_kind")
      VALUES
        (1, 'CH', 'PHONE', '+41 99 999 99 99', '+41 79 123 45 67', 16, '+41 ', 'NONE'),
        (1, 'CH', 'POSTAL_CODE', '9999', '1234', 4, NULL, 'NONE')
      ON CONFLICT ("country_code", "field_type") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "country_input_templates"
      WHERE "country_code" = 'CH'
        AND "field_type" IN ('PHONE', 'POSTAL_CODE')
    `);
  }
}
