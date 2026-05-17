"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

import {
  LESSON_RECORD_DIFFICULTIES,
  LESSON_RECORD_ENGAGEMENTS,
  LESSON_RECORD_SOCIAL_FORMS,
  ROOM_MOODS,
  TEACHER_PREPARATIONS,
  TEACHER_STRESS_LEVELS,
  type LessonRecordDifficulty,
  type LessonRecordEngagement,
  type LessonRecordObservation,
  type LessonRecordSocialForm,
  type RoomMood,
  type TeacherPreparation,
  type TeacherStressLevel,
} from "../types";

type Props = {
  value: LessonRecordObservation;
  onChange: (next: LessonRecordObservation) => void;
  /**
   * Compact mode renders the same content with tighter spacing — used in the
   * per-child accordion where the screen real estate is smaller.
   */
  compact?: boolean;
  className?: string;
};

/* ─── Tones ─────────────────────────────────────────────────────────────
 * Each "tone" is a static Tailwind class bundle so the JIT picks it up.
 * Active state: filled background in the tone color, white text, bolder.
 * Inactive state: outlined + small colored dot indicator.
 * ───────────────────────────────────────────────────────────────────── */

type Tone = "emerald" | "sky" | "amber" | "rose" | "slate";

const TONE_PRESSED: Record<Tone, string> = {
  emerald:
    "data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:border-emerald-600 data-[state=on]:shadow-sm",
  sky:
    "data-[state=on]:bg-sky-600 data-[state=on]:text-white data-[state=on]:border-sky-600 data-[state=on]:shadow-sm",
  amber:
    "data-[state=on]:bg-amber-500 data-[state=on]:text-white data-[state=on]:border-amber-500 data-[state=on]:shadow-sm",
  rose:
    "data-[state=on]:bg-rose-600 data-[state=on]:text-white data-[state=on]:border-rose-600 data-[state=on]:shadow-sm",
  slate:
    "data-[state=on]:bg-slate-700 data-[state=on]:text-white data-[state=on]:border-slate-700 data-[state=on]:shadow-sm",
};

const TONE_DOT: Record<Tone, string> = {
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  slate: "bg-slate-500",
};

/* Per-value tone maps (one per axis) */
const ENGAGEMENT_TONE: Record<LessonRecordEngagement, Tone> = {
  FOCUSED: "emerald",
  INTERESTED: "sky",
  DUTIFUL: "amber",
  RESISTANT: "rose",
};

const DIFFICULTY_TONE: Record<LessonRecordDifficulty, Tone> = {
  TOO_EASY: "emerald",
  JUST_RIGHT: "amber",
  TOO_HARD: "rose",
};

const SOCIAL_FORM_TONE: Record<LessonRecordSocialForm, Tone> = {
  ALONE: "slate",
  WITH_PARTNER: "sky",
  SMALL_GROUP: "amber",
  WITH_GUIDE: "emerald",
};

const PREPARATION_TONE: Record<TeacherPreparation, Tone> = {
  WELL_PREPARED: "emerald",
  ACCEPTABLE: "amber",
  RUSHED: "rose",
};

const ROOM_MOOD_TONE: Record<RoomMood, Tone> = {
  CALM: "emerald",
  FOCUSED: "sky",
  RESTLESS: "amber",
  DIFFICULT: "rose",
};

const STRESS_TONE: Record<TeacherStressLevel, Tone> = {
  RELAXED: "emerald",
  NORMAL: "amber",
  STRESSED: "rose",
};

/**
 * Two-section observation picker:
 *   1) LK-Selbstbeobachtung (per lesson record — same for all kids by default)
 *   2) LK-Beobachtung der Kinder (engagement / difficulty / social form)
 *
 * Schüler-Selbsteinschätzung kommt später — Felder bleiben im Typ, aber UI
 * exponiert sie aktuell nicht.
 *
 * Tap a badge to set; tap the same badge again to clear that axis.
 */
export const ObservationBadgeRow = ({
  value,
  onChange,
  compact = false,
  className,
}: Props) => {
  const t = useTranslations("RecordKeeping");

  const setAxis = <K extends keyof LessonRecordObservation>(
    key: K,
    next: LessonRecordObservation[K],
  ) => {
    onChange({
      ...value,
      [key]: value[key] === next ? null : next,
    });
  };

  const sectionGap = compact ? "gap-3" : "gap-4";
  const rowGap = compact ? "gap-1.5" : "gap-2";

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* ─── Sektion 1: LK-Selbstbeobachtung ─────────────────────────── */}
      <Section
        title={t("observationSectionTeacherSelf")}
        hint={compact ? undefined : t("observationSectionTeacherSelfHint")}
        accent="sky"
      >
        <div className={cn("flex flex-col", sectionGap)}>
          <Axis label={t("observationTeacherPreparation")} rowGap={rowGap}>
            {TEACHER_PREPARATIONS.map((v) => (
              <BadgeToggle
                key={v}
                tone={PREPARATION_TONE[v]}
                pressed={value.teacherPreparation === v}
                onPressedChange={() => setAxis("teacherPreparation", v)}
                label={t(`observationTeacherPreparation_${v}` as const)}
              />
            ))}
          </Axis>

          <Axis label={t("observationRoomMood")} rowGap={rowGap}>
            {ROOM_MOODS.map((v) => (
              <BadgeToggle
                key={v}
                tone={ROOM_MOOD_TONE[v]}
                pressed={value.roomMood === v}
                onPressedChange={() => setAxis("roomMood", v)}
                label={t(`observationRoomMood_${v}` as const)}
              />
            ))}
          </Axis>

          <Axis label={t("observationTeacherStress")} rowGap={rowGap}>
            {TEACHER_STRESS_LEVELS.map((v) => (
              <BadgeToggle
                key={v}
                tone={STRESS_TONE[v]}
                pressed={value.teacherStressLevel === v}
                onPressedChange={() => setAxis("teacherStressLevel", v)}
                label={t(`observationTeacherStress_${v}` as const)}
              />
            ))}
          </Axis>
        </div>
      </Section>

      {/* ─── Sektion 2: LK-Beobachtung der Kinder ─────────────────────── */}
      <Section
        title={t("observationSectionChildren")}
        hint={compact ? undefined : t("observationSectionChildrenHint")}
        accent="amber"
      >
        <div className={cn("flex flex-col", sectionGap)}>
          <Axis label={t("observationEngagement")} rowGap={rowGap}>
            {LESSON_RECORD_ENGAGEMENTS.map((v) => (
              <BadgeToggle
                key={v}
                tone={ENGAGEMENT_TONE[v]}
                pressed={value.engagement === v}
                onPressedChange={() => setAxis("engagement", v)}
                label={t(`observationEngagement_${v}` as const)}
              />
            ))}
          </Axis>

          <Axis label={t("observationDifficulty")} rowGap={rowGap}>
            {LESSON_RECORD_DIFFICULTIES.map((v) => (
              <BadgeToggle
                key={v}
                tone={DIFFICULTY_TONE[v]}
                pressed={value.difficulty === v}
                onPressedChange={() => setAxis("difficulty", v)}
                label={t(`observationDifficulty_${v}` as const)}
              />
            ))}
          </Axis>

          <Axis label={t("observationSocialForm")} rowGap={rowGap}>
            {LESSON_RECORD_SOCIAL_FORMS.map((v) => (
              <BadgeToggle
                key={v}
                tone={SOCIAL_FORM_TONE[v]}
                pressed={value.socialForm === v}
                onPressedChange={() => setAxis("socialForm", v)}
                label={t(`observationSocialForm_${v}` as const)}
                showDot={false}
              />
            ))}
          </Axis>

          <BadgeToggle
            tone="emerald"
            pressed={value.lessonClarityConfirmed === true}
            onPressedChange={() =>
              onChange({
                ...value,
                lessonClarityConfirmed:
                  value.lessonClarityConfirmed === true ? null : true,
              })
            }
            label={t("observationLessonClarity")}
            showDot={false}
            className="self-start"
          />
        </div>
      </Section>
    </div>
  );
};

/* ─── Building blocks ───────────────────────────────────────────────── */

const BadgeToggle = ({
  tone,
  pressed,
  onPressedChange,
  label,
  showDot = true,
  className,
}: {
  tone: Tone;
  pressed: boolean;
  onPressedChange: () => void;
  label: string;
  showDot?: boolean;
  className?: string;
}) => (
  <Toggle
    size="sm"
    variant="outline"
    pressed={pressed}
    onPressedChange={onPressedChange}
    className={cn(
      // base: outline becomes filled in tone color when pressed
      TONE_PRESSED[tone],
      "data-[state=on]:font-semibold",
      // when pressed, ditch hover affordance so it stays solid
      "data-[state=on]:hover:bg-current data-[state=on]:hover:text-white",
      className,
    )}
    aria-pressed={pressed}
  >
    {pressed ? (
      <Check aria-hidden="true" className="h-3 w-3" />
    ) : showDot ? (
      <span
        aria-hidden="true"
        className={cn("h-2 w-2 rounded-full", TONE_DOT[tone])}
      />
    ) : null}
    {label}
  </Toggle>
);

const SECTION_ACCENT = {
  sky: "border-l-sky-300 bg-sky-50/30",
  amber: "border-l-amber-300 bg-amber-50/30",
} as const;

const Section = ({
  title,
  hint,
  accent,
  children,
}: {
  title: string;
  hint?: string;
  accent: keyof typeof SECTION_ACCENT;
  children: React.ReactNode;
}) => (
  <section
    className={cn(
      "rounded-md border border-l-4 px-3 py-3",
      SECTION_ACCENT[accent],
    )}
  >
    <div className="mb-3">
      <h4 className="text-xl font-bold tracking-tight text-foreground">
        {title}
      </h4>
      {hint && <p className="text-sm text-muted-foreground mt-1">{hint}</p>}
    </div>
    {children}
  </section>
);

const Axis = ({
  label,
  rowGap,
  children,
}: {
  label: string;
  rowGap: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
    <div className={cn("flex flex-wrap", rowGap)}>{children}</div>
  </div>
);
