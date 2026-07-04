"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellRing, Mail, Phone, User2, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";
import { cn } from "@/lib/utils";
import { resolveCardFields, type CardFieldKey } from "../field-registry";
import type { KanbanApplication } from "../types";

interface Props {
  application: KanbanApplication;
  /** Vertical color strip (matches the column's stage colour). */
  stageColor?: string | null;
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

export function AdmissionCardVisual({
  application,
  stageColor,
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
  const birthYear = application.childDateOfBirth
    ? application.childDateOfBirth.slice(0, 4)
    : null;

  const chip = (key: CardFieldKey): React.ReactNode => {
    switch (key) {
      case "birthYear":
        return birthYear ? (
          <span
            key={key}
            title={t("fieldBirthYear")}
          >{`Jg. ${birthYear}`}</span>
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
          <span key={key} title={t("fieldAge")}>
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
      case "gradeLevel":
        return application.desiredGradeLevelName ? (
          <span
            key={key}
            className="inline-flex items-center gap-1"
            title={application.desiredGradeLevelName}
          >
            <span
              aria-hidden
              className="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-border"
              style={{
                backgroundColor:
                  application.desiredGradeLevelColor ?? "var(--muted)",
              }}
            />
            <span className="truncate">
              {application.desiredGradeLevelName}
            </span>
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
            className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1 text-primary"
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
          <span key={key} className="inline-flex items-center gap-0.5">
            <Phone className="h-2.5 w-2.5 shrink-0" />
            {application.family.primaryPhone}
          </span>
        ) : null;
      case "daysInStage":
        return daysInStage !== null && daysInStage > 0 ? (
          <Badge
            key={key}
            variant={daysInStage > 14 ? "destructive" : "outline"}
            className="px-1.5 text-[10px] leading-none"
            title={t("daysShort", { count: daysInStage })}
          >
            {daysInStage}d
          </Badge>
        ) : null;
      case "reminders":
        return application.openRemindersCount > 0 ? (
          <span
            key={key}
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
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

  const chips = fields.map(chip).filter(Boolean);

  return (
    <div
      className={cn(
        "group relative flex items-stretch overflow-hidden rounded-md border bg-card text-sm shadow-sm transition hover:shadow-md",
        dragging ? "opacity-90 shadow-lg" : "",
        onOpen && "cursor-pointer hover:bg-accent/40",
        className,
      )}
      role={onOpen ? "button" : undefined}
      onClick={onOpen ? () => onOpen(application.id) : undefined}
    >
      {/* Stage colour strip */}
      <span
        aria-hidden
        className="w-1 shrink-0"
        style={{ backgroundColor: stageColor ?? "var(--muted)" }}
      />

      <div className="flex flex-1 items-center gap-2 py-2 pl-2 pr-2">
        <StudentAvatar
          studentId={application.id}
          firstName={application.childFirstName}
          lastName={application.childLastName}
          className="h-8 w-8 shrink-0"
          fallbackClassName="text-[10px]"
        />

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">
            {application.childFirstName} {application.childLastName}
          </div>
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
              {chips}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
