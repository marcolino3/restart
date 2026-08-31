import { registerEnumType } from '@nestjs/graphql';

/** Which part of the day a single-day absence covers. Varchar, not PG enum. */
export enum AbsenceDayPart {
  FULL = 'FULL',
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
}

registerEnumType(AbsenceDayPart, { name: 'AbsenceDayPart' });
