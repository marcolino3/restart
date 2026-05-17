import { registerEnumType } from '@nestjs/graphql';

/**
 * Selbsteinschätzung des Kindes — Hatties stärkster Einflussfaktor (Effektstärke 1.44).
 * Idealerweise vom Kind selbst getappt (siehe `selfAssessmentByChild` Flag auf LessonRecord).
 */
export enum LessonRecordSelfAssessment {
  UNDERSTOOD = 'UNDERSTOOD',
  PARTIAL = 'PARTIAL',
  NEEDS_REPEAT = 'NEEDS_REPEAT',
}

registerEnumType(LessonRecordSelfAssessment, {
  name: 'LessonRecordSelfAssessment',
  description:
    'Selbsteinschätzung des Kindes: UNDERSTOOD / PARTIAL / NEEDS_REPEAT.',
});
