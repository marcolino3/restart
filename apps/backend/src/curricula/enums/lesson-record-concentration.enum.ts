import { registerEnumType } from '@nestjs/graphql';

/**
 * Konzentrations-/Vertiefungs-Phase des Kindes (Montessori: „Normalisation",
 * Polarisation der Aufmerksamkeit).
 * Ergänzt `engagement` um die Tiefen-Dimension: Flow ist mehr als Konzentration —
 * es ist die selbst-vergessene Vertiefung in eine Arbeit.
 */
export enum LessonRecordConcentration {
  FLOW = 'FLOW',
  PARTIAL_FOCUS = 'PARTIAL_FOCUS',
  INTERRUPTED = 'INTERRUPTED',
}

registerEnumType(LessonRecordConcentration, {
  name: 'LessonRecordConcentration',
  description:
    'Konzentrationsphase (Montessori-Normalisation): FLOW / PARTIAL_FOCUS / INTERRUPTED.',
});
