import { describe, expect, it } from "vitest";
import type { StudentLessonRecordItem } from "../actions/get-student-lesson-records.action";
import {
  deriveConcentrationMix,
  deriveConfidenceTrend,
  deriveEngagementTrend,
  deriveNoteTimeline,
  derivePersistenceOverTime,
  deriveSelfAssessmentCalibration,
  deriveVisibleLearnerRadar,
  deriveZpdGauge,
} from "./derive-observation-metrics";

const rec = (
  over: Partial<StudentLessonRecordItem>,
): StudentLessonRecordItem => ({
  id: "r1",
  lessonId: "les-1",
  recordedAt: "2026-01-01",
  status: "INTRODUCED",
  ...over,
});

describe("deriveConfidenceTrend", () => {
  it("reports no data when nothing carries a selfConfidence value", () => {
    expect(deriveConfidenceTrend([rec({})]).hasData).toBe(false);
  });

  it("maps CONFIDENT/TENTATIVE/INSECURE to +1/0/-1 and computes the average", () => {
    const trend = deriveConfidenceTrend([
      rec({ id: "r1", recordedAt: "2026-01-01", selfConfidence: "CONFIDENT" }),
      rec({ id: "r2", recordedAt: "2026-01-02", selfConfidence: "INSECURE" }),
    ]);
    expect(trend.hasData).toBe(true);
    expect(trend.points.map((p) => p.score)).toEqual([1, -1]);
    expect(trend.average).toBe(0);
    expect(trend.latest).toBe(-1);
  });
});

describe("deriveConcentrationMix", () => {
  it("reports no data when no record has a concentration value", () => {
    expect(deriveConcentrationMix([rec({})]).hasData).toBe(false);
  });

  it("counts per bucket and computes flowPercent", () => {
    const mix = deriveConcentrationMix([
      rec({ id: "r1", concentration: "FLOW" }),
      rec({ id: "r2", concentration: "FLOW" }),
      rec({ id: "r3", concentration: "INTERRUPTED" }),
    ]);
    expect(mix.total).toBe(3);
    expect(mix.counts.FLOW).toBe(2);
    expect(mix.flowPercent).toBe(67);
  });
});

describe("derivePersistenceOverTime", () => {
  it("buckets records into ISO weeks and keeps only the last 12", () => {
    const result = derivePersistenceOverTime([
      rec({ id: "r1", recordedAt: "2026-01-05", persistence: "PERSISTS" }),
      rec({ id: "r2", recordedAt: "2026-01-06", persistence: "GIVES_UP" }),
    ]);
    expect(result.hasData).toBe(true);
    expect(result.buckets).toHaveLength(1);
    expect(result.buckets[0].persists).toBe(1);
    expect(result.buckets[0].givesUp).toBe(1);
  });

  it("reports no data when nothing has a persistence value", () => {
    expect(derivePersistenceOverTime([rec({})]).hasData).toBe(false);
  });
});

describe("deriveZpdGauge", () => {
  it("reports no data when nothing has a difficulty value", () => {
    expect(deriveZpdGauge([rec({})]).hasData).toBe(false);
  });

  it("computes sweetSpotPercent from JUST_RIGHT ratio in the recent window", () => {
    const gauge = deriveZpdGauge([
      rec({ id: "r1", recordedAt: "2026-01-01", difficulty: "JUST_RIGHT" }),
      rec({ id: "r2", recordedAt: "2026-01-02", difficulty: "TOO_HARD" }),
      rec({ id: "r3", recordedAt: "2026-01-03", difficulty: "TOO_EASY" }),
      rec({ id: "r4", recordedAt: "2026-01-04", difficulty: "JUST_RIGHT" }),
    ]);
    expect(gauge.total).toBe(4);
    expect(gauge.justRight).toBe(2);
    expect(gauge.sweetSpotPercent).toBe(50);
  });
});

describe("deriveEngagementTrend", () => {
  it("reports no data when nothing has an engagement value", () => {
    expect(deriveEngagementTrend([rec({})]).hasData).toBe(false);
  });

  it("maps engagement values to scores and computes the average", () => {
    const trend = deriveEngagementTrend([
      rec({ id: "r1", recordedAt: "2026-01-01", engagement: "FOCUSED" }),
      rec({ id: "r2", recordedAt: "2026-01-02", engagement: "RESISTANT" }),
    ]);
    expect(trend.points.map((p) => p.score)).toEqual([3, 0]);
    expect(trend.average).toBe(1.5);
  });
});

describe("deriveVisibleLearnerRadar", () => {
  it("flags hasEnoughData=false below the sample threshold", () => {
    const radar = deriveVisibleLearnerRadar([
      rec({ id: "r1", engagement: "FOCUSED" }),
    ]);
    expect(radar.hasEnoughData).toBe(false);
  });

  it("computes per-axis positive percentages independent of sample size per axis", () => {
    const records = Array.from({ length: 20 }, (_, i) =>
      rec({
        id: `r${i}`,
        recordedAt: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`,
        engagement: i < 10 ? "FOCUSED" : "RESISTANT",
      }),
    );
    const radar = deriveVisibleLearnerRadar(records);
    expect(radar.hasEnoughData).toBe(true);
    const engagementAxis = radar.axes.find((a) => a.key === "ENGAGEMENT");
    expect(engagementAxis?.value).toBe(50);
    expect(engagementAxis?.sample).toBe(20);
  });
});

describe("deriveSelfAssessmentCalibration", () => {
  it("reports no evaluation when there is no self-assessment follow-up", () => {
    const calib = deriveSelfAssessmentCalibration([rec({})]);
    expect(calib.evaluated).toBe(0);
    expect(calib.hasEnoughData).toBe(false);
  });

  it("counts an overestimation when UNDERSTOOD is followed by NEEDS_MORE within 60 days", () => {
    const calib = deriveSelfAssessmentCalibration([
      rec({
        id: "r1",
        recordedAt: "2026-01-01",
        selfAssessmentByChild: true,
        selfAssessment: "UNDERSTOOD",
      }),
      rec({ id: "r2", recordedAt: "2026-01-15", status: "NEEDS_MORE" }),
    ]);
    expect(calib.evaluated).toBe(1);
    expect(calib.overestimated).toBe(1);
  });

  it("counts an underestimation when NEEDS_REPEAT is followed by MASTERED within 60 days", () => {
    const calib = deriveSelfAssessmentCalibration([
      rec({
        id: "r1",
        recordedAt: "2026-01-01",
        selfAssessmentByChild: true,
        selfAssessment: "NEEDS_REPEAT",
      }),
      rec({ id: "r2", recordedAt: "2026-01-15", status: "MASTERED" }),
    ]);
    expect(calib.evaluated).toBe(1);
    expect(calib.underestimated).toBe(1);
  });

  it("ignores a follow-up more than 60 days later", () => {
    const calib = deriveSelfAssessmentCalibration([
      rec({
        id: "r1",
        recordedAt: "2026-01-01",
        selfAssessmentByChild: true,
        selfAssessment: "UNDERSTOOD",
      }),
      rec({ id: "r2", recordedAt: "2026-06-01", status: "NEEDS_MORE" }),
    ]);
    expect(calib.evaluated).toBe(0);
  });
});

describe("deriveNoteTimeline", () => {
  it("filters out records without a note and sorts newest-first", () => {
    const timeline = deriveNoteTimeline(
      [
        rec({ id: "r1", recordedAt: "2026-01-01", note: "Erste Notiz" }),
        rec({ id: "r2", recordedAt: "2026-01-02", note: "" }),
        rec({ id: "r3", recordedAt: "2026-01-03", note: "Zweite Notiz" }),
      ],
      "de",
    );
    expect(timeline).toHaveLength(2);
    expect(timeline[0].id).toBe("r3");
  });
});
