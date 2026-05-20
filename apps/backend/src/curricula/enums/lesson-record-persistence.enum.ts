import { registerEnumType } from '@nestjs/graphql';

/**
 * Wie das Kind mit Schwierigkeiten umgeht.
 * Hattie-Bezug: Persistence / Concentration / Effort (d ≈ 0.54) — kombiniert
 * mit Hatties „productive struggle". `SEEKS_HELP` ist explizit positiv
 * (Help-seeking ist ein metakognitiver Wirkfaktor, d ≈ 0.72).
 */
export enum LessonRecordPersistence {
  PERSISTS = 'PERSISTS',
  SEEKS_HELP = 'SEEKS_HELP',
  GIVES_UP = 'GIVES_UP',
}

registerEnumType(LessonRecordPersistence, {
  name: 'LessonRecordPersistence',
  description:
    'Umgang mit Schwierigkeit: PERSISTS / SEEKS_HELP / GIVES_UP.',
});
