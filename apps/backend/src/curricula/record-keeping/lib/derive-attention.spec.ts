import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';
import {
  AttentionRecordInput,
  deriveStudentAttentionItems,
} from './derive-attention';

describe('deriveStudentAttentionItems', () => {
  it('computes a real day-gap for STUCK_PRACTICED when recordedAt is a full ISO timestamp', () => {
    // recorded_at is now timestamptz — recordedAt carries a time-of-day,
    // not just a bare YYYY-MM-DD date.
    const records: AttentionRecordInput[] = [
      {
        id: 'r1',
        studentId: 's1',
        lessonId: 'l1',
        recordedAt: '2026-01-01T09:30:00.000Z',
        status: LessonRecordStatus.PRACTICED,
      },
    ];
    const today = new Date('2026-04-15T12:00:00.000Z');

    const items = deriveStudentAttentionItems(records, 'de', undefined, today);

    const stuck = items.find((i) => i.reason === 'STUCK_PRACTICED');
    expect(stuck).toBeDefined();
    expect(stuck!.days).not.toBeNaN();
    expect(stuck!.days).toBeGreaterThanOrEqual(90);
  });
});
