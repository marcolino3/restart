import { registerEnumType } from '@nestjs/graphql';

/**
 * Wahrgenommener Schwierigkeitsgrad aus Sicht der Lehrkraft (Zone of Proximal Development).
 */
export enum LessonRecordDifficulty {
  TOO_EASY = 'TOO_EASY',
  JUST_RIGHT = 'JUST_RIGHT',
  TOO_HARD = 'TOO_HARD',
}

registerEnumType(LessonRecordDifficulty, {
  name: 'LessonRecordDifficulty',
  description: 'Schwierigkeitsgrad (ZPD): TOO_EASY / JUST_RIGHT / TOO_HARD.',
});
