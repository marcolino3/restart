import { registerEnumType } from '@nestjs/graphql';

/**
 * Lehrer-Aktion hinter einer Lektion.
 * - P:        Presentation (formelle Darbietung)
 * - THREE_PL: Three-Period Lesson (Drei-Stufen-Lektion, AMI-Standard)
 * - E:        Extension (Erweiterung)
 * - M:        Material Series (Material-Iteration / -Variante)
 * - S:        Game (Spiel)
 */
export enum LessonType {
  P = 'P',
  THREE_PL = 'THREE_PL',
  E = 'E',
  M = 'M',
  S = 'S',
}

registerEnumType(LessonType, {
  name: 'LessonType',
  description:
    'Lehrer-Aktion hinter einer Lektion: P / 3PL / E / M / S (Montessori-Klassifizierung).',
});
