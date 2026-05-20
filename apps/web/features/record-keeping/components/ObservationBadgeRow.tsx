"use client";

import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

import {
  LESSON_RECORD_CONCENTRATIONS,
  LESSON_RECORD_DIFFICULTIES,
  LESSON_RECORD_ENGAGEMENTS,
  LESSON_RECORD_PERSISTENCES,
  LESSON_RECORD_SELF_CONFIDENCES,
  LESSON_RECORD_SOCIAL_FORMS,
  ROOM_MOODS,
  TEACHER_PREPARATIONS,
  TEACHER_STRESS_LEVELS,
  type LessonRecordConcentration,
  type LessonRecordDifficulty,
  type LessonRecordEngagement,
  type LessonRecordObservation,
  type LessonRecordPersistence,
  type LessonRecordSelfConfidence,
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
  /**
   * Hides the LK-Selbstbeobachtung section (preparation / room mood / stress).
   * Used in the per-child accordion since teacher-self values are captured
   * once at the bulk level — repeating them per child would be noise.
   */
  hideTeacherSelf?: boolean;
  /**
   * Renders the children-observation section (engagement, difficulty, …) as a
   * collapsible block that starts closed. Used at the bulk level so the form
   * stays scannable; the per-child view leaves this off because each accordion
   * row is already its own expand step.
   */
  collapsibleChildren?: boolean;
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
    "data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:border-emerald-600 data-[state=on]:shadow-sm data-[state=on]:hover:bg-emerald-700 data-[state=on]:hover:text-white data-[state=on]:hover:border-emerald-700",
  sky:
    "data-[state=on]:bg-sky-600 data-[state=on]:text-white data-[state=on]:border-sky-600 data-[state=on]:shadow-sm data-[state=on]:hover:bg-sky-700 data-[state=on]:hover:text-white data-[state=on]:hover:border-sky-700",
  amber:
    "data-[state=on]:bg-amber-500 data-[state=on]:text-white data-[state=on]:border-amber-500 data-[state=on]:shadow-sm data-[state=on]:hover:bg-amber-600 data-[state=on]:hover:text-white data-[state=on]:hover:border-amber-600",
  rose:
    "data-[state=on]:bg-rose-600 data-[state=on]:text-white data-[state=on]:border-rose-600 data-[state=on]:shadow-sm data-[state=on]:hover:bg-rose-700 data-[state=on]:hover:text-white data-[state=on]:hover:border-rose-700",
  slate:
    "data-[state=on]:bg-slate-700 data-[state=on]:text-white data-[state=on]:border-slate-700 data-[state=on]:shadow-sm data-[state=on]:hover:bg-slate-800 data-[state=on]:hover:text-white data-[state=on]:hover:border-slate-800",
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
  MECHANICAL: "amber",
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

const SELF_CONFIDENCE_TONE: Record<LessonRecordSelfConfidence, Tone> = {
  CONFIDENT: "emerald",
  TENTATIVE: "amber",
  INSECURE: "rose",
};

const PERSISTENCE_TONE: Record<LessonRecordPersistence, Tone> = {
  PERSISTS: "emerald",
  SEEKS_HELP: "sky",
  GIVES_UP: "rose",
};

const CONCENTRATION_TONE: Record<LessonRecordConcentration, Tone> = {
  FLOW: "emerald",
  PARTIAL_FOCUS: "amber",
  INTERRUPTED: "rose",
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
  hideTeacherSelf = false,
  collapsibleChildren = false,
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
      {!hideTeacherSelf && (
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
      )}

      {/* ─── Sektion 2: LK-Beobachtung der Kinder ─────────────────────── */}
      <Section
        title={t(
          hideTeacherSelf ? "observationSectionChild" : "observationSectionChildren",
        )}
        hint={compact ? undefined : t("observationSectionChildrenHint")}
        accent="amber"
        collapsible={collapsibleChildren}
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

          <Axis label={t("observationSelfConfidence")} rowGap={rowGap}>
            {LESSON_RECORD_SELF_CONFIDENCES.map((v) => (
              <BadgeToggle
                key={v}
                tone={SELF_CONFIDENCE_TONE[v]}
                pressed={value.selfConfidence === v}
                onPressedChange={() => setAxis("selfConfidence", v)}
                label={t(`observationSelfConfidence_${v}` as const)}
              />
            ))}
          </Axis>

          <Axis label={t("observationPersistence")} rowGap={rowGap}>
            {LESSON_RECORD_PERSISTENCES.map((v) => (
              <BadgeToggle
                key={v}
                tone={PERSISTENCE_TONE[v]}
                pressed={value.persistence === v}
                onPressedChange={() => setAxis("persistence", v)}
                label={t(`observationPersistence_${v}` as const)}
              />
            ))}
          </Axis>

          <Axis label={t("observationConcentration")} rowGap={rowGap}>
            {LESSON_RECORD_CONCENTRATIONS.map((v) => (
              <BadgeToggle
                key={v}
                tone={CONCENTRATION_TONE[v]}
                pressed={value.concentration === v}
                onPressedChange={() => setAxis("concentration", v)}
                label={t(`observationConcentration_${v}` as const)}
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
      // base: outline becomes filled in tone color when pressed; hover darkens
      // by one Tailwind step so the badge keeps tone identity instead of
      // flashing back to neutral accent.
      TONE_PRESSED[tone],
      "data-[state=on]:font-semibold",
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
  collapsible = false,
  children,
}: {
  title: string;
  hint?: string;
  accent: keyof typeof SECTION_ACCENT;
  /** Wraps the body in a collapse that starts closed (header acts as trigger). */
  collapsible?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const isOpen = !collapsible || open;
  return (
    <section
      className={cn(
        "rounded-md border border-l-4 px-3 py-3",
        SECTION_ACCENT[accent],
      )}
    >
      {collapsible ? (
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setOpen((v) => !v)}
          className="-mx-1 -my-1 flex w-full items-center justify-between gap-3 rounded px-1 py-1 text-left hover:bg-black/[0.03]"
        >
          <div className="flex flex-col">
            <h4 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h4>
            {hint && isOpen && (
              <p className="text-sm text-muted-foreground mt-1">{hint}</p>
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>
      ) : (
        <div className="mb-3">
          <h4 className="text-xl font-bold tracking-tight text-foreground">
            {title}
          </h4>
          {hint && <p className="text-sm text-muted-foreground mt-1">{hint}</p>}
        </div>
      )}
      {isOpen && <div className={cn(collapsible && "mt-3")}>{children}</div>}
    </section>
  );
};

const Axis = ({
  label,
  rowGap,
  children,
}: {
  label: string;
  rowGap: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <Label className="text-sm font-semibold text-foreground">{label}</Label>
    <div className={cn("flex flex-wrap", rowGap)}>{children}</div>
  </div>
);
