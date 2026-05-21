import { CurriculumLocale } from '../enums/curriculum-locale.enum';
import { CurriculumNodeType } from '../enums/curriculum-node-type.enum';
import type {
  CurriculumParseResult,
  CurriculumRawRow,
} from './curriculum-file-parser';
import { buildImportPlan, type PlanNode } from './curriculum-plan-builder';

function row(
  seq: number | null,
  level: string,
  area: string | null,
  topic: string | null,
  group: string | null,
  lesson: string,
  rowNumber = 1,
): CurriculumRawRow {
  return { sequence: seq, level, area, topic, group, lesson, rowNumber };
}

function buildParsed(
  sheets: Partial<Record<CurriculumLocale, CurriculumRawRow[]>>,
  warnings: string[] = [],
): CurriculumParseResult {
  return {
    master: CurriculumLocale.DE,
    sheetsByLocale: sheets,
    warnings,
  };
}

function findTranslation(
  translations: PlanNode['translations'],
  locale: CurriculumLocale,
): string | undefined {
  return translations.find((t) => t.locale === locale)?.name;
}

describe('buildImportPlan', () => {
  it('single-locale (DE-only) plan keeps existing behavior', () => {
    const plan = buildImportPlan(
      buildParsed({
        DE: [
          row(
            1,
            'Unterstufe',
            'Mathe',
            'Algebra',
            'Gleichungen',
            'Lineare Gl.',
          ),
          row(2, 'Unterstufe', 'Mathe', 'Algebra', 'Gleichungen', 'Quadr. Gl.'),
        ],
      }),
    );
    expect(plan.levels).toHaveLength(1);
    expect(plan.stats.lessonCount).toBe(2);
    const lesson = plan.levels[0].roots[0].children[0].children[0].children[0];
    expect(lesson.nodeType).toBe(CurriculumNodeType.LESSON);
    expect(findTranslation(lesson.translations, CurriculumLocale.DE)).toBe(
      'Lineare Gl.',
    );
  });

  it('attaches FR translations to existing master nodes via Sequence', () => {
    const plan = buildImportPlan(
      buildParsed({
        DE: [
          row(
            1,
            'Unterstufe',
            'Mathe',
            'Algebra',
            'Gleichungen',
            'Lineare Gl.',
          ),
        ],
        FR: [
          row(1, 'Inférieur', 'Maths', 'Algèbre', 'Équations', 'Eq. linéaire'),
        ],
      }),
    );
    const level = plan.levels[0];
    expect(findTranslation(level.translations, CurriculumLocale.FR)).toBe(
      'Inférieur',
    );
    const area = level.roots[0];
    expect(findTranslation(area.translations, CurriculumLocale.FR)).toBe(
      'Maths',
    );
    const lesson = area.children[0].children[0].children[0];
    expect(findTranslation(lesson.translations, CurriculumLocale.FR)).toBe(
      'Eq. linéaire',
    );
  });

  it('partial FR translation → warning for missing master rows', () => {
    const plan = buildImportPlan(
      buildParsed({
        DE: [
          row(1, 'Lower', 'Math', 'Algebra', 'Eq', 'Linear'),
          row(2, 'Lower', 'Math', 'Algebra', 'Eq', 'Quadratic'),
        ],
        FR: [row(1, 'Inf.', 'Maths', 'Algèbre', 'Éq', 'Linéaire')],
      }),
    );
    expect(
      plan.warnings.some((w) => w.includes('FR') && w.includes('1 master row')),
    ).toBe(true);
  });

  it('extra Sequence in FR (not in master) → warning + ignored', () => {
    const plan = buildImportPlan(
      buildParsed({
        DE: [row(1, 'Lower', 'Math', null, null, 'Linear')],
        FR: [
          row(1, 'Inf.', 'Maths', null, null, 'Linéaire'),
          row(99, 'Inf.', 'Maths', null, null, 'Ghost'),
        ],
      }),
    );
    expect(
      plan.warnings.some(
        (w) => w.includes('FR') && w.toLowerCase().includes('not exist'),
      ),
    ).toBe(true);
    expect(plan.stats.lessonCount).toBe(1);
  });

  it('inconsistent translation across FR rows for same Topic emits warning', () => {
    const plan = buildImportPlan(
      buildParsed({
        DE: [
          row(1, 'Lower', 'Math', 'Algebra', 'Eq', 'Linear'),
          row(2, 'Lower', 'Math', 'Algebra', 'Eq', 'Quadratic'),
        ],
        FR: [
          row(1, 'Inf.', 'Maths', 'Algèbre', 'Éq', 'Linéaire'),
          row(2, 'Inf.', 'Maths', 'Equations', 'Éq', 'Quadratique'), // Topic differs!
        ],
      }),
    );
    expect(
      plan.warnings.some(
        (w) =>
          w.toLowerCase().includes('conflict') ||
          w.toLowerCase().includes('algèbre'),
      ),
    ).toBe(true);
  });

  it('all four locales attach translations', () => {
    const plan = buildImportPlan(
      buildParsed({
        DE: [row(1, 'A', null, null, null, 'L1')],
        FR: [row(1, 'A_FR', null, null, null, 'L1_FR')],
        IT: [row(1, 'A_IT', null, null, null, 'L1_IT')],
        EN: [row(1, 'A_EN', null, null, null, 'L1_EN')],
      }),
    );
    const lesson = plan.levels[0].roots[0];
    expect(lesson.translations).toHaveLength(4);
    expect(lesson.translations.map((t) => t.locale).sort()).toEqual([
      'DE',
      'EN',
      'FR',
      'IT',
    ]);
  });
});
