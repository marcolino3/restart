import { registerEnumType } from '@nestjs/graphql';

/**
 * Sozialform der Lerntätigkeit — Grundlage für Methoden-Wirkungsanalyse.
 */
export enum LessonRecordSocialForm {
  ALONE = 'ALONE',
  WITH_PARTNER = 'WITH_PARTNER',
  SMALL_GROUP = 'SMALL_GROUP',
  WITH_GUIDE = 'WITH_GUIDE',
}

registerEnumType(LessonRecordSocialForm, {
  name: 'LessonRecordSocialForm',
  description:
    'Sozialform: ALONE / WITH_PARTNER / SMALL_GROUP / WITH_GUIDE.',
});
