import { registerEnumType } from '@nestjs/graphql';

/**
 * LK-Selbstbeobachtung: Wie gut war die Lehrkraft auf die Lektion vorbereitet?
 */
export enum TeacherPreparation {
  WELL_PREPARED = 'WELL_PREPARED',
  ACCEPTABLE = 'ACCEPTABLE',
  RUSHED = 'RUSHED',
}

registerEnumType(TeacherPreparation, {
  name: 'TeacherPreparation',
  description:
    'LK-Selbsteinschätzung der Vorbereitung: WELL_PREPARED / ACCEPTABLE / RUSHED.',
});
