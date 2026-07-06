"use client";

import { Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellRing, Mail, Phone, User2, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";
import { cn } from "@/lib/utils";
import { resolveCardFields, type CardFieldKey } from "../field-registry";
import type { KanbanApplication } from "../types";

interface Props {
  application: KanbanApplication;
  /** Per-stage field selection; `null`/omitted ⇒ default set. */
  cardFields?: string[] | null;
  dragging?: boolean;
  onOpen?: (id: string) => void;
  className?: string;
}

const GENDER_GLYPH: Record<
  NonNullable<KanbanApplication["childGender"]>,
  string
> = {
  MALE: "♂",
  FEMALE: "♀",
  OTHER: "⚧",
};

const statusKey = (status: KanbanApplication["status"]): string => {
  switch (status) {
    case "ACTIVE":
      return "statusActive";
    case "REJECTED":
      return "statusRejected";
    case "ENROLLED":
      return "statusEnrolled";
    case "ARCHIVED":
    default:
      return "statusArchived";
  }
};

const sourceKey = (source: KanbanApplication["source"]): string => {
  switch (source) {
    case "PUBLIC_FORM":
      return "sourcePublicForm";
    case "OPEN_DAY":
      return "sourceOpenDay";
    case "REFERRAL":
      return "sourceReferral";
    case "OTHER":
      return "sourceOther";
    case "MANUAL":
    default:
      return "sourceManual";
  }
};

/** ISO date (`2019-04-01`) → Swiss format (`01.04.2019`). */
const swissDate = (iso: string): string =>
  iso.slice(0, 10).split("-").reverse().join(".");

export function AdmissionCardVisual({
  application,
  cardFields,
  dragging,
  onOpen,
  className,
}: Props) {
  const t = useTranslations("Admissions");
  // `Date.now()` differs between SSR and client hydration — defer to a client-
  // only effect so the initial markup matches the server's null state.
  const [daysInStage, setDaysInStage] = useState<number | null>(null);
  useEffect(() => {
    setDaysInStage(
      Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(application.stageEnteredAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      ),
    );
  }, [application.stageEnteredAt]);

  const fields = resolveCardFields(cardFields);
  // Design layout: the days-in-stage badge lives in row 1 (right of the name)
  // and the desired grade level renders as an outline badge in its own row —
  // pull both out of the configurable meta-chip row.
  const showDays = fields.includes("daysInStage");
  const showGrade = fields.includes("gradeLevel");
  const metaFields = fields.filter(
    (k) => k !== "daysInStage" && k !== "gradeLevel",
  );

  const chip = (key: CardFieldKey): React.ReactNode => {
    switch (key) {
      case "birthYear":
        return application.childDateOfBirth ? (
          <span key={key} className="tabular-nums" title={t("fieldBirthYear")}>
            {`geb. ${swissDate(application.childDateOfBirth)}`}
          </span>
        ) : null;
      case "age": {
        if (!application.childDateOfBirth) return null;
        const dob = new Date(application.childDateOfBirth);
        const now = new Date();
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
        if (age < 0) return null;
        return (
          <span key={key} className="tabular-nums" title={t("fieldAge")}>
            {t("ageYears", { count: age })}
          </span>
        );
      }
      case "gender":
        return application.childGender ? (
          <span key={key} title={t("fieldGender")}>
            {GENDER_GLYPH[application.childGender]}
          </span>
        ) : null;
      case "source":
        return (
          <span key={key} title={t("fieldSource")}>
            {t(sourceKey(application.source))}
          </span>
        );
      case "status":
        return (
          <span key={key} title={t("fieldStatus")}>
            {t(statusKey(application.status))}
          </span>
        );
      case "familyName":
        return application.family.name ? (
          <span key={key} className="truncate" title={t("fieldFamilyName")}>
            {application.family.name}
          </span>
        ) : null;
      case "siblings":
        return application.family.childrenCount > 1 ? (
          <span
            key={key}
            className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1 tabular-nums text-primary"
            title={t("fieldSiblings")}
          >
            <Users2 className="h-2.5 w-2.5" />
            {application.family.childrenCount}
          </span>
        ) : null;
      case "contactName": {
        const name = application.family.contactNames[0];
        return name ? (
          <span key={key} className="inline-flex items-center gap-0.5 truncate">
            <User2 className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{name}</span>
          </span>
        ) : null;
      }
      case "contactEmail":
        return application.family.primaryEmail ? (
          <span key={key} className="inline-flex items-center gap-0.5 truncate">
            <Mail className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{application.family.primaryEmail}</span>
          </span>
        ) : null;
      case "contactPhone":
        return application.family.primaryPhone ? (
          <span
            key={key}
            className="inline-flex items-center gap-0.5 tabular-nums"
          >
            <Phone className="h-2.5 w-2.5 shrink-0" />
            {application.family.primaryPhone}
          </span>
        ) : null;
      case "reminders":
        return application.openRemindersCount > 0 ? (
          <span
            key={key}
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-[600] tabular-nums",
              application.overdueRemindersCount > 0
                ? "bg-status-rose text-status-rose-foreground"
                : "bg-status-amber text-status-amber-foreground",
            )}
            title={t("openRemindersTitle", {
              open: application.openRemindersCount,
              overdue: application.overdueRemindersCount,
            })}
          >
            {application.overdueRemindersCount > 0 ? (
              <BellRing className="h-2.5 w-2.5" />
            ) : (
              <Bell className="h-2.5 w-2.5" />
            )}
            {application.openRemindersCount}
          </span>
        ) : null;
      default:
        return null;
    }
  };

  const metaChips = metaFields.map(chip).filter(Boolean);

  return (
    <div
      className={cn(
        "group grid gap-1.5 rounded-card border bg-card p-2.5 text-sm shadow-xs transition hover:shadow-md",
        dragging ? "opacity-90 shadow-lg" : "",
        onOpen && "cursor-pointer hover:bg-accent/40",
        className,
      )}
      role={onOpen ? "button" : undefined}
      onClick={onOpen ? () => onOpen(application.id) : undefined}
    >
      {/* Row 1 — avatar · name · days-in-stage */}
      <div className="flex items-center gap-2">
        <StudentAvatar
          studentId={application.id}
          firstName={application.childFirstName}
          lastName={application.childLastName}
          className="h-6 w-6 shrink-0"
          fallbackClassName="text-[9px]"
        />
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-tight">
          {application.childFirstName} {application.childLastName}
        </span>
        {showDays && daysInStage !== null && daysInStage > 0 && (
          <span
            className={cn(
              "shrink-0 font-mono text-[10px] tabular-nums",
              daysInStage > 14
                ? "font-[600] text-destructive"
                : "text-muted-foreground",
            )}
            title={t("daysShort", { count: daysInStage })}
          >
            {daysInStage}d
          </span>
        )}
      </div>

      {/* Row 2 — configurable meta chips, `·`-separated */}
      {metaChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
          {metaChips.map((c, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <span aria-hidden className="text-muted-foreground/60">
                  ·
                </span>
              )}
              {c}
            </Fragment>
          ))}
        </div>
      )}

      {/* Row 3 — desired grade level as outline badge */}
      {showGrade && application.desiredGradeLevelName && (
        <Badge
          variant="outline"
          className="h-4 w-fit px-1.5 text-[10px] font-medium leading-none"
          style={
            application.desiredGradeLevelColor
              ? {
                  borderColor: application.desiredGradeLevelColor,
                  color: application.desiredGradeLevelColor,
                }
              : undefined
          }
          title={t("fieldGradeLevel")}
        >
          {application.desiredGradeLevelName}
        </Badge>
      )}
    </div>
  );
}
