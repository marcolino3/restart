import { registerEnumType } from '@nestjs/graphql';

/**
 * Beobachtetes Selbstvertrauen des Kindes während der Lektion.
 * Hattie-Bezug: Self-efficacy (d ≈ 0.92) — höchster realistisch beobachtbarer
 * Wirkfaktor in einer einzelnen Lektion.
 */
export enum LessonRecordSelfConfidence {
  CONFIDENT = 'CONFIDENT',
  TENTATIVE = 'TENTATIVE',
  INSECURE = 'INSECURE',
}

registerEnumType(LessonRecordSelfConfidence, {
  name: 'LessonRecordSelfConfidence',
  description:
    'Beobachtetes Selbstvertrauen: CONFIDENT / TENTATIVE / INSECURE.',
});
