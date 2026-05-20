import { registerEnumType } from '@nestjs/graphql';

/**
 * Beobachtetes Engagement des Kindes während der Lektion.
 * Hattie-Bezug: Engagement-Indikator, Montessori: Polarisation der Aufmerksamkeit.
 */
export enum LessonRecordEngagement {
  FOCUSED = 'FOCUSED',
  INTERESTED = 'INTERESTED',
  /** Surface engagement per Hattie — child complies without inner buy-in. */
  MECHANICAL = 'MECHANICAL',
  RESISTANT = 'RESISTANT',
}

registerEnumType(LessonRecordEngagement, {
  name: 'LessonRecordEngagement',
  description:
    'Beobachtetes Engagement: FOCUSED / INTERESTED / MECHANICAL / RESISTANT.',
});
