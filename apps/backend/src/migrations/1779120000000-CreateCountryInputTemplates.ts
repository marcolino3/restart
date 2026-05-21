import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

type Seed = {
  countryCode: string;
  fieldType: 'PHONE' | 'IBAN' | 'SSN' | 'POSTAL_CODE';
  mask: string;
  placeholder?: string;
  maxLength?: number;
  regex?: string;
  prefix?: string;
  validatorKind?: 'NONE' | 'IBAN_MOD97' | 'CH_SSN' | 'REGEX';
};

const SEEDS: Seed[] = [
  // --- PHONE ---
  {
    countryCode: 'CH',
    fieldType: 'PHONE',
    mask: '+41 99 999 99 99',
    placeholder: '+41 79 123 45 67',
    prefix: '+41 ',
  },
  {
    countryCode: 'DE',
    fieldType: 'PHONE',
    mask: '+49 999 99999999',
    placeholder: '+49 30 12345678',
    prefix: '+49 ',
  },
  {
    countryCode: 'AT',
    fieldType: 'PHONE',
    mask: '+43 999 9999999',
    placeholder: '+43 660 1234567',
    prefix: '+43 ',
  },
  {
    countryCode: 'FR',
    fieldType: 'PHONE',
    mask: '+33 9 99 99 99 99',
    placeholder: '+33 6 12 34 56 78',
    prefix: '+33 ',
  },
  {
    countryCode: 'IT',
    fieldType: 'PHONE',
    mask: '+39 999 999 9999',
    placeholder: '+39 320 123 4567',
    prefix: '+39 ',
  },

  // IBAN ist global standardisiert (ISO 13616) und wird direkt im
  // IbanFormField hartcodiert — kein DB-Template nötig.

  // --- SSN (CH only for now) ---
  {
    countryCode: 'CH',
    fieldType: 'SSN',
    mask: '756.9999.9999.99',
    placeholder: '756.1234.5678.97',
    maxLength: 16,
    prefix: '756.',
    validatorKind: 'CH_SSN',
  },
];

export class CreateCountryInputTemplates1779120000000 implements MigrationInterface {
  name = 'CreateCountryInputTemplates1779120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'country_input_templates_field_type_enum') THEN
          CREATE TYPE "country_input_templates_field_type_enum" AS ENUM (
            'PHONE', 'IBAN', 'SSN', 'POSTAL_CODE'
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'country_input_templates_validator_kind_enum') THEN
          CREATE TYPE "country_input_templates_validator_kind_enum" AS ENUM (
            'NONE', 'IBAN_MOD97', 'CH_SSN', 'REGEX'
          );
        END IF;
      END$$;
    `);

    const hasTable = await queryRunner.hasTable('country_input_templates');
    if (!hasTable) {
      await queryRunner.createTable(
        new Table({
          name: 'country_input_templates',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'gen_random_uuid()',
            },
            { name: 'version', type: 'integer', default: 1 },
            { name: 'isActive', type: 'boolean', default: true },
            { name: 'isArchived', type: 'boolean', default: false },
            { name: 'createdAt', type: 'timestamp', default: 'now()' },
            { name: 'updatedAt', type: 'timestamp', default: 'now()' },
            { name: 'deletedAt', type: 'date', isNullable: true },
            { name: 'country_code', type: 'varchar', length: '10' },
            {
              name: 'field_type',
              type: 'country_input_templates_field_type_enum',
            },
            { name: 'mask', type: 'varchar', length: '100' },
            {
              name: 'placeholder',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            { name: 'max_length', type: 'integer', isNullable: true },
            {
              name: 'regex',
              type: 'varchar',
              length: '500',
              isNullable: true,
            },
            {
              name: 'prefix',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'validator_kind',
              type: 'country_input_templates_validator_kind_enum',
              default: `'NONE'`,
            },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'country_input_templates',
        new TableIndex({
          name: 'uq_country_input_templates_country_field',
          columnNames: ['country_code', 'field_type'],
          isUnique: true,
        }),
      );

      await queryRunner.createIndex(
        'country_input_templates',
        new TableIndex({
          name: 'idx_country_input_templates_field',
          columnNames: ['field_type'],
        }),
      );
    }

    for (const s of SEEDS) {
      await queryRunner.query(
        `
          INSERT INTO country_input_templates
            (version, country_code, field_type, mask, placeholder, max_length, regex, prefix, validator_kind)
          VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (country_code, field_type) DO NOTHING
        `,
        [
          s.countryCode,
          s.fieldType,
          s.mask,
          s.placeholder ?? null,
          s.maxLength ?? null,
          s.regex ?? null,
          s.prefix ?? null,
          s.validatorKind ?? 'NONE',
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('country_input_templates', true);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "country_input_templates_field_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "country_input_templates_validator_kind_enum"`,
    );
  }
}
