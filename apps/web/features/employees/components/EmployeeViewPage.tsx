"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pencil, Paperclip } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DetailCols,
  DetailPanel,
  KvRow,
} from "@/components/common/DetailPanel";
import { UserEmailField } from "@/features/users/components/UserEmailField";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

import type { EmployeeDetail } from "../actions/get-employee-by-id.action";
import type { EmployeeNoteItem } from "@/features/employee-notes/actions/get-employee-notes.action";
import type { EmployeeContract } from "../actions/employee-contracts.actions";
import type { EmployeeReportResult } from "@/features/time-tracking/actions/get-time-report.action";
import EmployeeNotesFeed from "@/features/employee-notes/components/EmployeeNotesFeed";
import EmployeeNotesTimeline from "@/features/employee-notes/components/EmployeeNotesTimeline";
import CreateEmployeeNoteInline from "@/features/employee-notes/components/CreateEmployeeNoteInline";
import EmployeeContractsTab from "./EmployeeContractsTab";
import EmployeeHistoryFeed from "./EmployeeHistoryFeed";

interface EmployeeViewPageProps {
  employee: EmployeeDetail;
  notes: EmployeeNoteItem[];
  contracts: EmployeeContract[];
  report: EmployeeReportResult;
  employeeName: string;
}

/** Minutes → "+12:30" / "−2:15". */
const fmtBalance = (min?: number | null): string => {
  if (min == null) return "–";
  const sign = min < 0 ? "−" : "+";
  const a = Math.abs(min);
  return `${sign}${Math.floor(a / 60)}:${String(a % 60).padStart(2, "0")}`;
};
const fmtHours = (min?: number | null): string =>
  min == null ? "–" : `${(min / 60).toFixed(1)} h`;

const STAT_TONE: Record<string, string> = {
  green: "bg-status-green text-status-green-foreground",
  sky: "bg-status-sky text-status-sky-foreground",
  amber: "bg-status-amber text-status-amber-foreground",
  rose: "bg-status-rose text-status-rose-foreground",
  slate: "bg-status-slate text-status-slate-foreground",
};

/** Stat box from the design handoff (`.lsb`). */
function StatBox({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: React.ReactNode;
  tone?: keyof typeof STAT_TONE | string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-ctl px-[15px] py-3",
        STAT_TONE[tone] ?? STAT_TONE.slate,
      )}
    >
      <span className="text-[11px] font-semibold opacity-70">{label}</span>
      <span className="text-[20px] font-bold tabular-nums">{value}</span>
    </div>
  );
}

function getInitials(firstName?: string, lastName?: string): string {
  return (
    (firstName?.charAt(0)?.toUpperCase() ?? "") +
      (lastName?.charAt(0)?.toUpperCase() ?? "") || "?"
  );
}

export default function EmployeeViewPage({
  employee,
  notes,
  contracts,
  report,
  employeeName,
}: EmployeeViewPageProps) {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const tN = useTranslations("EmployeeNotes");
  const tCountries = useTranslations("Countries");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const user = employee.membership?.user;
  const membership = employee.membership;
  const primaryEmail =
    user?.userEmails?.find((e) => e.isPrimary)?.email ??
    user?.userEmails?.[0]?.email;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "–";
    return new Date(dateStr).toLocaleDateString(
      locale === "de" ? "de-CH" : "en-GB",
      { day: "numeric", month: "long", year: "numeric" },
    );
  };

  const monthYear = (dateStr: string | null | undefined) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString(
          locale === "de" ? "de-CH" : "en-GB",
          { month: "short", year: "numeric" },
        )
      : null;

  // Aktuell gültiger Vertrag (jüngster Beginn ≤ heute) für die Kopf-Chips.
  const todayIso = new Date().toISOString().slice(0, 10);
  const currentContract = [...contracts]
    .filter((c) => c.startDate && c.startDate.slice(0, 10) <= todayIso)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0];

  const pensum =
    currentContract?.workloadPercent != null
      ? Math.round(Number(currentContract.workloadPercent))
      : null;
  const entry = monthYear(currentContract?.startDate);

  const metaChips: string[] = [t(membership?.persona ?? "EMPLOYEE")];
  if (pensum != null) metaChips.push(`${pensum}% ${t("workloadPercent")}`);
  if (entry) metaChips.push(tE("joinedOn", { date: entry }));

  // pf-tabs (saas-konzept): Accent-Unterstrich statt Pill-Container.
  const tabCls =
    "rounded-none border-b-[3px] border-transparent px-0 pb-[11px] text-[13.5px] font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-[650] data-[state=active]:text-foreground data-[state=active]:shadow-none";

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full"
    >
            {/* Profile band — saas-konzept `.pf-band` (light panel) */}
            <div className="mb-[18px] overflow-x-auto rounded-card border bg-card px-[22px] pt-[18px] shadow-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex size-[52px] shrink-0 items-center justify-center rounded-[16px] bg-accent text-[18px] font-bold text-accent-foreground">
                  {getInitials(user?.firstName, user?.lastName)}
                </span>
                <div className="min-w-0">
                  <h2 className="text-[20px] font-bold tracking-[-0.02em]">
                    {employeeName}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {metaChips.map((chip, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-field px-[11px] py-1 text-[11.5px] font-semibold text-muted-foreground"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="ml-auto flex shrink-0 gap-[9px]">
                  <Button asChild className="h-9">
                    <Link
                      href={`${ROUTES.admin.employeesEdit(locale, employee.id)}?tab=${activeTab}`}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      {t("edit")}
                    </Link>
                  </Button>
                </div>
              </div>
              <TabsList className="mt-[14px] h-auto justify-start gap-[22px] rounded-none bg-transparent p-0">
                <TabsTrigger className={tabCls} value="overview">
                  {tE("overview")}
                </TabsTrigger>
                <TabsTrigger className={tabCls} value="contracts">
                  {tE("tabContract")}
                </TabsTrigger>
                <TabsTrigger className={tabCls} value="absences">
                  {tE("tabAbsences")}
                </TabsTrigger>
                <TabsTrigger className={tabCls} value="timetracking">
                  {tE("tabTimeTracking")}
                </TabsTrigger>
                <TabsTrigger className={tabCls} value="logbook">
                  {tE("tabNotes")}
                </TabsTrigger>
                <TabsTrigger className={tabCls} value="documents">
                  {tE("tabDocuments")}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview — design cols2 panels */}
            <TabsContent value="overview">
              <DetailCols>
                <DetailPanel title={tE("contractAndWorkload")}>
                  <KvRow label={tE("hr.position")}>
                    {currentContract?.position ||
                      t(membership?.persona ?? "EMPLOYEE")}
                  </KvRow>
                  <KvRow label={t("workloadPercent")}>
                    {pensum != null ? (
                      <span className="inline-flex items-center gap-[9px]">
                        <span className="h-2 w-20 overflow-hidden rounded-full bg-field">
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.min(100, Math.max(0, pensum))}%`,
                            }}
                          />
                        </span>
                        {pensum}%
                      </span>
                    ) : (
                      "–"
                    )}
                  </KvRow>
                  <KvRow label={tE("contracts")}>
                    {currentContract
                      ? ([
                          currentContract.contractType
                            ? tE(`contractType.${currentContract.contractType}`)
                            : null,
                          entry ? tE("sinceMonth", { date: entry }) : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "–")
                      : "–"}
                  </KvRow>
                  <KvRow label={tE("hr.annualVacationDays")}>
                    {currentContract?.annualVacationDays != null
                      ? tE("vacationDaysPerYear", {
                          days: currentContract.annualVacationDays,
                        })
                      : "–"}
                  </KvRow>
                  <KvRow label={tE("timeTrackingEnabled")}>
                    {employee.timeTrackingEnabled
                      ? t("active")
                      : t("inactive")}
                  </KvRow>
                </DetailPanel>

                <DetailPanel title={tE("contactAndPerson")}>
                  <KvRow label={t("email")}>
                    {user?.id ? (
                      <UserEmailField
                        userId={user.id}
                        currentEmail={primaryEmail}
                      />
                    ) : (
                      (primaryEmail ?? "–")
                    )}
                  </KvRow>
                  <KvRow label={t("phone")}>
                    {membership?.contactPhone || "–"}
                  </KvRow>
                  <KvRow label={t("dateOfBirth")}>
                    {formatDate(user?.dateOfBirth)}
                  </KvRow>
                  <KvRow label={t("socialSecurityNumber")}>
                    {user?.socialSecurityNumber || "–"}
                  </KvRow>
                  {membership?.organization && (
                    <KvRow label={t("organization")}>
                      {membership.organization.name}
                    </KvRow>
                  )}
                  {membership?.roles && membership.roles.length > 0 && (
                    <KvRow label={tE("roles")}>
                      <span className="flex flex-wrap justify-end gap-1.5">
                        {membership.roles.map((role) => (
                          <Badge
                            key={role.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {role.name ?? role.systemCode ?? "–"}
                          </Badge>
                        ))}
                      </span>
                    </KvRow>
                  )}
                </DetailPanel>

                <DetailPanel title={t("address")}>
                  <KvRow label={t("street")}>
                    {[user?.street, user?.houseNumber]
                      .filter(Boolean)
                      .join(" ") || "–"}
                  </KvRow>
                  {user?.addressLine2 && (
                    <KvRow label={t("addressLine2")}>
                      {user.addressLine2}
                    </KvRow>
                  )}
                  <KvRow label={t("postalCode")}>
                    {[user?.postalCode, user?.city]
                      .filter(Boolean)
                      .join(" ") || "–"}
                  </KvRow>
                  <KvRow label={t("country")}>
                    {user?.country ? tCountries(user.country) : "–"}
                  </KvRow>
                </DetailPanel>
              </DetailCols>
            </TabsContent>

            {/* Absenzen */}
            <TabsContent value="absences">
              <DetailPanel title={tE("tabAbsences")}>
                {report.categorySummary.length ? (
                  report.categorySummary.map((c) => (
                    <KvRow
                      key={c.categoryId}
                      label={
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block size-2 shrink-0 rounded-full"
                            style={{ background: c.color ?? "var(--muted)" }}
                          />
                          {c.name}
                        </span>
                      }
                    >
                      {tE("daysCount", { days: c.totalDays })}
                    </KvRow>
                  ))
                ) : (
                  <p className="text-[13px] text-muted-foreground">
                    {tE("noAbsences")}
                  </p>
                )}
              </DetailPanel>
            </TabsContent>

            {/* Zeiterfassung */}
            <TabsContent value="timetracking">
              <DetailPanel title={tE("tabTimeTracking")}>
                <div className="grid grid-cols-2 gap-[9px] md:grid-cols-4">
                  <StatBox
                    tone="green"
                    label={t("timeBalanceMinutes")}
                    value={fmtBalance(report.balance?.netBalanceMinutes)}
                  />
                  <StatBox
                    tone="sky"
                    label={tE("remainingVacation")}
                    value={
                      report.vacation?.remainingDays != null
                        ? `${report.vacation.remainingDays} d`
                        : "–"
                    }
                  />
                  <StatBox
                    tone="slate"
                    label={tE("worked")}
                    value={fmtHours(report.balance?.workedMinutes)}
                  />
                  <StatBox
                    tone="slate"
                    label={tE("planned")}
                    value={fmtHours(report.balance?.plannedMinutes)}
                  />
                </div>
              </DetailPanel>
            </TabsContent>


            {/* Logbook */}
            <TabsContent value="logbook">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <div className="bg-card shadow-sm sm:overflow-hidden sm:rounded-lg border">
                    <div className="divide-y divide-border">
                      <div className="px-4 py-5 sm:px-6">
                        <h2 className="text-lg font-medium text-foreground">
                          {tN("logbook")}
                        </h2>
                      </div>
                      <div className="px-4 py-6 sm:px-6">
                        <EmployeeNotesFeed notes={notes} />
                      </div>
                    </div>
                    <div className="bg-muted/50 px-4 py-6 sm:px-6">
                      <CreateEmployeeNoteInline employeeId={employee.id} />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <EmployeeNotesTimeline notes={notes} />
                </div>
              </div>
            </TabsContent>

            {/* Documents / Attachments */}
            <TabsContent value="documents">
              <DetailPanel title={tE("tabDocuments")}>
                <ul
                  role="list"
                  className="mt-2 divide-y divide-border rounded-ctl border border-border"
                >
                  <li className="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6">
                    <div className="flex w-0 flex-1 items-center">
                      <Paperclip
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted-foreground"
                      />
                      <div className="ml-4 flex min-w-0 flex-1 gap-2">
                        <span className="truncate font-medium text-foreground">
                          arbeitsvertrag_2024.pdf
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          2.4mb
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 shrink-0">
                      <a
                        href="#"
                        className="font-medium text-primary hover:text-primary/80"
                      >
                        {t("download")}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6">
                    <div className="flex w-0 flex-1 items-center">
                      <Paperclip
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted-foreground"
                      />
                      <div className="ml-4 flex min-w-0 flex-1 gap-2">
                        <span className="truncate font-medium text-foreground">
                          zeugnis_2024.pdf
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          4.5mb
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 shrink-0">
                      <a
                        href="#"
                        className="font-medium text-primary hover:text-primary/80"
                      >
                        {t("download")}
                      </a>
                    </div>
                  </li>
                </ul>
              </DetailPanel>
            </TabsContent>

            {/* Verträge */}
            <TabsContent value="contracts">
              <EmployeeContractsTab
                employeeId={employee.id}
                contracts={contracts}
                editable
              />
            </TabsContent>
          </Tabs>
  );
}
