import {
  applyExclusiveScheduleFields,
  hasScheduleWindows,
  hasScheduleWorkloads,
} from './contract-schedule';

describe('contract-schedule', () => {
  describe('hasScheduleWindows', () => {
    it('rejects empty objects and null-only days', () => {
      expect(hasScheduleWindows(null)).toBe(false);
      expect(hasScheduleWindows({})).toBe(false);
      expect(hasScheduleWindows({ mon: null, tue: [] })).toBe(false);
    });

    it('detects real windows', () => {
      expect(
        hasScheduleWindows({ mon: [{ start: '08:00', end: '12:00' }] }),
      ).toBe(true);
    });
  });

  describe('hasScheduleWorkloads', () => {
    it('rejects empty / zero shares', () => {
      expect(hasScheduleWorkloads(null)).toBe(false);
      expect(hasScheduleWorkloads({})).toBe(false);
      expect(hasScheduleWorkloads({ mon: 0, tue: null })).toBe(false);
    });

    it('detects positive shares', () => {
      expect(hasScheduleWorkloads({ mon: 20 })).toBe(true);
      expect(hasScheduleWorkloads({ mon: '20' })).toBe(true);
    });
  });

  describe('applyExclusiveScheduleFields', () => {
    it('keeps windows and clears workloads', () => {
      const values = {
        weekdayTimeWindows: { mon: [{ start: '08:00', end: '12:00' }] },
        weekdayWorkloads: { mon: 20 },
      };
      applyExclusiveScheduleFields(values);
      expect(values.weekdayWorkloads).toBeNull();
      expect(values.weekdayTimeWindows).toEqual({
        mon: [{ start: '08:00', end: '12:00' }],
      });
    });

    it('keeps workloads when windows are empty', () => {
      const values = {
        weekdayTimeWindows: {},
        weekdayWorkloads: { mon: 20 },
      };
      applyExclusiveScheduleFields(values);
      expect(values.weekdayTimeWindows).toBeNull();
      expect(values.weekdayWorkloads).toEqual({ mon: 20 });
    });

    it('clears both when neither has content', () => {
      const values = {
        weekdayTimeWindows: {},
        weekdayWorkloads: { mon: 0 },
      };
      applyExclusiveScheduleFields(values);
      expect(values.weekdayTimeWindows).toBeNull();
      expect(values.weekdayWorkloads).toBeNull();
    });
  });
});
