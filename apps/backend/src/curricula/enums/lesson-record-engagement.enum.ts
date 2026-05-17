import { registerEnumType } from '@nestjs/graphql';

/**
 * Beobachtetes Engagement des Kindes während der Lektion.
 * Hattie-Bezug: Engagement-Indikator, Montessori: Polarisation der Aufmerksamkeit.
 */
export enum LessonRecordEngagement {
  FOCUSED = 'FOCUSED',
  INTERESTED = 'INTERESTED',
  DUTIFUL = 'DUTIFUL',
  RESISTANT = 'RESISTANT',
}

registerEnumType(LessonRecordEngagement, {
  name: 'LessonRecordEngagement',
  description:
    'Beobachtetes Engagement: FOCUSED / INTERESTED / DUTIFUL / RESISTANT.',
});
