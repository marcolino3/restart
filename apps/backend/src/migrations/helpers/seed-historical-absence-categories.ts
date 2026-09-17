import { QueryRunner } from 'typeorm';
import { ABSENCE_CATEGORY_SNAPSHOTS } from './absence-category-snapshots';

/** Only columns and enum values available at these historical migration points. */
export async function seedHistoricalAbsenceCategories(
  runner: QueryRunner,
  codes: string[],
): Promise<void> {
  const organizations: { id: string }[] = await runner.query(
    'SELECT id FROM organizations WHERE "isArchived" = false',
  );
  for (const org of organizations) {
    for (const definition of ABSENCE_CATEGORY_SNAPSHOTS.filter((d) =>
      codes.includes(d.code),
    )) {
      const { code, translations, ...defaults } = definition;
      const columns = Object.keys(defaults).map((key) =>
        key.replace(/[A-Z]/g, (letter) => '_' + letter.toLowerCase()),
      );
      const values = [org.id, code, ...Object.values(defaults)];
      await runner.query(
        'INSERT INTO employee_absence_categories (version, is_system, organization_id, system_code, ' +
          columns.join(', ') +
          ') VALUES (1, true, ' +
          values.map((_, index) => '$' + (index + 1)).join(', ') +
          ') ON CONFLICT (organization_id, system_code) DO NOTHING',
        values,
      );
      const [{ id }] = await runner.query(
        'SELECT id FROM employee_absence_categories WHERE organization_id=$1 AND system_code=$2',
        [org.id, code],
      );
      for (const [locale, translation] of Object.entries(translations)) {
        await runner.query(
          'INSERT INTO employee_absence_category_translations (version, category_id, locale, name, description) VALUES (1, $1, $2, $3, $4) ON CONFLICT (category_id, locale) DO NOTHING',
          [id, locale, translation.name, translation.description ?? null],
        );
      }
    }
  }
}
