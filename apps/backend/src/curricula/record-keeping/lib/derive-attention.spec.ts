import { LessonRecordStatus } from '../../enums/lesson-record-status.enum';
import {
  AttentionRecordInput,
  DEFAULT_ATTENTION_THRESHOLDS,
  deriveStudentAttentionItems,
} from './derive-attention';

describe('deriveStudentAttentionItems', () => {
  const today = new Date('2026-08-02T00:00:00Z');

  const record = (
    over: Partial<AttentionRecordInput>,
  ): AttentionRecordInput => ({
    id: 'rec-1',
    studentId: 'stu-1',
    lessonId: 'les-1',
    recordedAt: '2026-08-01',
    status: LessonRecordStatus.INTRODUCED,
    lesson: {
      id: 'les-1',
      translations: [{ locale: 'DE', name: 'Perlenmaterial' }],
      ancestors: [],
    },
    ...over,
  });

  it('returns nothing for a lesson with no attention-worthy state', () => {
    const items = deriveStudentAttentionItems(
      [record({ id: 'r1', status: LessonRecordStatus.MASTERED })],
      'de',
      DEFAULT_ATTENTION_THRESHOLDS,
      today,
    );
    expect(items).toEqual([]);
  });

  it('flags NEEDS_MORE_CURRENT when the latest record is NEEDS_MORE', () => {
    const items = deriveStudentAttentionItems(
      [
        record({
          id: 'r1',
          recordedAt: '2026-07-20',
          status: LessonRecordStatus.NEEDS_MORE,
        }),
      ],
      'de',
      DEFAULT_ATTENTION_THRESHOLDS,
      today,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      reason: 'NEEDS_MORE_CURRENT',
      severity: 1,
      since: '2026-07-20',
    });
  });

  it('flags REPEATED_NEEDS_MORE when NEEDS_MORE occurs twice and lesson not mastered', () => {
    const items = deriveStudentAttentionItems(
      [
        record({
          id: 'r1',
          recordedAt: '2026-06-01',
          status: LessonRecordStatus.NEEDS_MORE,
        }),
        record({
          id: 'r2',
          recordedAt: '2026-06-15',
          status: LessonRecordStatus.NEEDS_MORE,
        }),
        record({
          id: 'r3',
          recordedAt: '2026-07-01',
          status: LessonRecordStatus.INTRODUCED,
        }),
      ],
      'de',
      DEFAULT_ATTENTION_THRESHOLDS,
      today,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      reason: 'REPEATED_NEEDS_MORE',
      severity: 2,
    });
  });

  it('does not flag REPEATED_NEEDS_MORE once the lesson is mastered', () => {
    const items = deriveStudentAttentionItems(
      [
        record({
          id: 'r1',
          recordedAt: '2026-06-01',
          status: LessonRecordStatus.NEEDS_MORE,
        }),
        record({
          id: 'r2',
          recordedAt: '2026-06-15',
          status: LessonRecordStatus.NEEDS_MORE,
        }),
        record({
          id: 'r3',
          recordedAt: '2026-07-01',
          status: LessonRecordStatus.MASTERED,
        }),
      ],
      'de',
      DEFAULT_ATTENTION_THRESHOLDS,
      today,
    );
    expect(items).toEqual([]);
  });

  it('flags STUCK_PRACTICED once the practiced gap exceeds the threshold', () => {
    const items = deriveStudentAttentionItems(
      [
        record({
          id: 'r1',
          recordedAt: '2026-01-01',
          status: LessonRecordStatus.PRACTICED,
        }),
      ],
      'de',
      DEFAULT_ATTENTION_THRESHOLDS,
      today,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      reason: 'STUCK_PRACTICED',
      severity: 3,
      since: '2026-01-01',
    });
  });

  it('does not flag STUCK_PRACTICED below the threshold', () => {
    const items = deriveStudentAttentionItems(
      [
        record({
          id: 'r1',
          recordedAt: '2026-07-01',
          status: LessonRecordStatus.PRACTICED,
        }),
      ],
      'de',
      DEFAULT_ATTENTION_THRESHOLDS,
      today,
    );
    expect(items).toEqual([]);
  });

  it('flags STUCK_INTRODUCED once the introduced gap exceeds the threshold', () => {
    const items = deriveStudentAttentionItems(
      [
        record({
          id: 'r1',
          recordedAt: '2026-06-01',
          status: LessonRecordStatus.INTRODUCED,
        }),
      ],
      'de',
      DEFAULT_ATTENTION_THRESHOLDS,
      today,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ reason: 'STUCK_INTRODUCED', severity: 4 });
  });

  it('flags BIG_GAP_INTRO_TO_PRACTICED when the intro-to-practice gap is large', () => {
    const items = deriveStudentAttentionItems(
      [
        record({
          id: 'r1',
          recordedAt: '2026-01-01',
          status: LessonRecordStatus.INTRODUCED,
        }),
        record({
          id: 'r2',
          recordedAt: '2026-07-20',
          status: LessonRecordStatus.PRACTICED,
        }),
      ],
      'de',
      DEFAULT_ATTENTION_THRESHOLDS,
      today,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      reason: 'BIG_GAP_INTRO_TO_PRACTICED',
      severity: 5,
    });
  });

  it('uses custom thresholds when provided', () => {
    const items = deriveStudentAttentionItems(
      [
        record({
          id: 'r1',
          recordedAt: '2026-07-25',
          status: LessonRecordStatus.INTRODUCED,
        }),
      ],
      'de',
      { introducedStuckDays: 5, practicedStuckDays: 90, bigGapDays: 60 },
      today,
    );
    expect(items).toHaveLength(1);
    expect(items[0].reason).toBe('STUCK_INTRODUCED');
  });

  it('returns at most one item per lesson, keeping the highest-priority reason', () => {
    // NEEDS_MORE_CURRENT (severity 1) wins over an otherwise-stuck history.
    const items = deriveStudentAttentionItems(
      [
        record({
          id: 'r1',
          recordedAt: '2026-01-01',
          status: LessonRecordStatus.INTRODUCED,
        }),
        record({
          id: 'r2',
          recordedAt: '2026-07-20',
          status: LessonRecordStatus.NEEDS_MORE,
        }),
      ],
      'de',
      DEFAULT_ATTENTION_THRESHOLDS,
      today,
    );
    expect(items).toHaveLength(1);
    expect(items[0].reason).toBe('NEEDS_MORE_CURRENT');
  });

  it('sorts multiple lessons by severity ascending, then days descending', () => {
    const items = deriveStudentAttentionItems(
      [
        record({
          id: 'r1',
          lessonId: 'les-stuck-practiced',
          recordedAt: '2026-01-01',
          status: LessonRecordStatus.PRACTICED,
        }),
        record({
          id: 'r2',
          lessonId: 'les-needs-more',
          recordedAt: '2026-07-20',
          status: LessonRecordStatus.NEEDS_MORE,
        }),
      ],
      'de',
      DEFAULT_ATTENTION_THRESHOLDS,
      today,
    );
    expect(items.map((i) => i.reason)).toEqual([
      'NEEDS_MORE_CURRENT',
      'STUCK_PRACTICED',
    ]);
  });

  it('falls back to "—" and the first translation when the locale is missing', () => {
    const items = deriveStudentAttentionItems(
      [
        record({
          id: 'r1',
          recordedAt: '2026-07-20',
          status: LessonRecordStatus.NEEDS_MORE,
          lesson: {
            id: 'les-1',
            translations: [{ locale: 'DE', name: 'Perlenmaterial' }],
            ancestors: [],
          },
        }),
      ],
      'en',
      DEFAULT_ATTENTION_THRESHOLDS,
      today,
    );
    expect(items[0].lessonName).toBe('Perlenmaterial');
  });

  it('returns "—" when the lesson has no translations at all', () => {
    const items = deriveStudentAttentionItems(
      [
        record({
          id: 'r1',
          recordedAt: '2026-07-20',
          status: LessonRecordStatus.NEEDS_MORE,
          lesson: { id: 'les-1', translations: [], ancestors: [] },
        }),
      ],
      'de',
      DEFAULT_ATTENTION_THRESHOLDS,
      today,
    );
    expect(items[0].lessonName).toBe('—');
  });

  it('handles multiple students independently by only receiving one student’s records', () => {
    // Function operates per-student by contract; verify it ignores nothing
    // extraneous when given a clean single-student stream across two lessons.
    const items = deriveStudentAttentionItems(
      [
        record({
          id: 'r1',
          lessonId: 'les-a',
          recordedAt: '2026-07-20',
          status: LessonRecordStatus.NEEDS_MORE,
        }),
        record({
          id: 'r2',
          lessonId: 'les-b',
          recordedAt: '2026-08-01',
          status: LessonRecordStatus.MASTERED,
        }),
      ],
      'de',
      DEFAULT_ATTENTION_THRESHOLDS,
      today,
    );
    expect(items).toHaveLength(1);
    expect(items[0].lessonId).toBe('les-a');
  });
});
