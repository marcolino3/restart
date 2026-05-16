"use client";

import { useLocale, useTranslations } from "next-intl";
import { Pencil, User as UserIcon } from "lucide-react";

import type { EmployeeAuditLogItem } from "../actions/get-employee-audit-log.action";

interface Props {
  logs: EmployeeAuditLogItem[];
}

export default function EmployeeHistoryFeed({ logs }: Props) {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const tH = useTranslations("EmployeeHistory");
  const locale = useLocale();

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(locale === "de" ? "de-CH" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const knownInCommon = new Set([
    "firstName",
    "lastName",
    "title",
    "dateOfBirth",
    "socialSecurityNumber",
    "phone",
    "persona",
    "street",
    "houseNumber",
    "addressLine2",
    "postalCode",
    "city",
    "country",
  ]);
  const knownInEmployees = new Set(["timeTrackingEnabled"]);
  const fieldNameToLabel: Record<string, string> = {
    contactPhone: t("phone"),
  };

  const safeFieldLabel = (raw: string) => {
    if (fieldNameToLabel[raw]) return fieldNameToLabel[raw];
    if (knownInCommon.has(raw)) return t(raw);
    if (knownInEmployees.has(raw)) return tE(raw);
    return raw;
  };

  const renderValue = (v: string | null | undefined) =>
    v && v.length > 0 ? v : "–";

  if (!logs || logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{tH("noEntries")}</p>
    );
  }

  return (
    <ul role="list" className="space-y-6">
      {logs.map((entry, idx) => {
        const actor = entry.actorMembership?.user;
        const actorName = actor
          ? `${actor.firstName} ${actor.lastName}`.trim()
          : tH("systemActor");
        const isLast = idx === logs.length - 1;

        return (
          <li key={entry.id} className="relative flex gap-x-4">
            {!isLast && (
              <div className="absolute top-0 left-0 flex w-6 justify-center -bottom-6">
                <div className="w-px bg-border" />
              </div>
            )}

            <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-background">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted ring-1 ring-border">
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>

            <div className="flex-auto rounded-md p-3 ring-1 ring-inset ring-border bg-card">
              <div className="flex justify-between gap-x-4">
                <div className="py-0.5 text-xs leading-5 text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <UserIcon className="h-3 w-3" />
                    {actorName}
                  </span>
                  {" "}
                  {tH("changed")}{" "}
                  <span className="font-medium text-foreground">
                    {safeFieldLabel(entry.fieldName)}
                  </span>
                </div>
                <time
                  dateTime={entry.createdAt}
                  className="flex-none py-0.5 text-xs leading-5 text-muted-foreground"
                >
                  {formatTimestamp(entry.createdAt)}
                </time>
              </div>
              <div className="mt-2 text-sm leading-6 text-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="rounded-sm bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive line-through">
                    {renderValue(entry.oldValue)}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                    {renderValue(entry.newValue)}
                  </span>
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
