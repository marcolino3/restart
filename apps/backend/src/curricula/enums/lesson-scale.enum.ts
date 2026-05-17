import { registerEnumType } from '@nestjs/graphql';

/**
 * Skala einer Lektion (Transparent-Classroom-Konvention):
 * - MASTERABLE: kann gemeistert werden (klassische Materialien)
 * - ONGOING:    fortlaufende Praxis (z.B. Pflege-Aktivitäten)
 */
export enum LessonScale {
  MASTERABLE = 'MASTERABLE',
  ONGOING = 'ONGOING',
}

registerEnumType(LessonScale, {
  name: 'LessonScale',
  description:
    'Skala einer Lektion: MASTERABLE oder ONGOING (Transparent Classroom-Konvention).',
});
