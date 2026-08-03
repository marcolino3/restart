import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds DE/FR/IT/EN translations for org employee functions. Backfills DE from
 * the legacy `name` column and adds FR/IT/EN for known system defaults.
 */
export class AddEmployeeFunctionTranslations1783140100000 implements MigrationInterface {
  name = 'AddEmployeeFunctionTranslations1783140100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."employee_function_translations_locale_enum" AS ENUM('DE', 'FR', 'IT', 'EN')
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employee_function_translations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" integer NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" date,
        "function_id" uuid NOT NULL,
        "locale" "public"."employee_function_translations_locale_enum" NOT NULL,
        "name" varchar(200) NOT NULL,
        CONSTRAINT "pk_employee_function_translations" PRIMARY KEY ("id"),
        CONSTRAINT "fk_employee_function_translations_fn"
          FOREIGN KEY ("function_id") REFERENCES "employee_functions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_employee_function_translation" ON "employee_function_translations" ("function_id", "locale")`,
    );

    // DE from legacy name column
    await queryRunner.query(`
      INSERT INTO "employee_function_translations" ("function_id", "locale", "name")
      SELECT f."id", 'DE'::"public"."employee_function_translations_locale_enum", f."name"
      FROM "employee_functions" f
      WHERE NOT EXISTS (
        SELECT 1 FROM "employee_function_translations" t
        WHERE t."function_id" = f."id" AND t."locale" = 'DE'::"public"."employee_function_translations_locale_enum"
      )
    `);

    const defaults: Array<[string, string, string, string]> = [
      [
        'Klassenleitung',
        'Direction de classe',
        'Direzione di classe',
        'Class teacher',
      ],
      ['Lehrperson', 'Enseignant·e', 'Docente', 'Teacher'],
      ['Assistenz', 'Assistance', 'Assistenza', 'Assistant'],
      [
        'Pädagog:in Kinderhaus',
        'Éducateur·trice crèche',
        'Educatore/trice asilo',
        'Early years educator',
      ],
      ['Sekretariat', 'Secrétariat', 'Segreteria', 'Office staff'],
      [
        'Schulleitung',
        "Direction d'école",
        'Direzione scolastica',
        'School leadership',
      ],
    ];

    for (const [de, fr, it, en] of defaults) {
      for (const [locale, label] of [
        ['FR', fr],
        ['IT', it],
        ['EN', en],
      ] as const) {
        await queryRunner.query(
          `
          INSERT INTO "employee_function_translations" ("function_id", "locale", "name")
          SELECT f."id", $2::"public"."employee_function_translations_locale_enum", $3
          FROM "employee_functions" f
          WHERE f."name" = $1
            AND NOT EXISTS (
              SELECT 1 FROM "employee_function_translations" t
              WHERE t."function_id" = f."id" AND t."locale" = $2::"public"."employee_function_translations_locale_enum"
            )
          `,
          [de, locale, label],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "employee_function_translations"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."employee_function_translations_locale_enum"`,
    );
  }
}
