"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pencil, Paperclip } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserEmailField } from "@/features/users/components/UserEmailField";
import { ROUTES } from "@/constants/routes";

import type { EmployeeDetail } from "../actions/get-employee-by-id.action";
import type { EmployeeNoteItem } from "@/features/employee-notes/actions/get-employee-notes.action";
import type { EmployeeAuditLogItem } from "../actions/get-employee-audit-log.action";
import type { EmployeeHrProfile } from "../actions/get-employee-hr-profile.action";
import type { EmployeeEmergencyProfile } from "../actions/get-employee-emergency-profile.action";
import type { EmployeeContract } from "../actions/employee-contracts.actions";
import EmployeeNotesFeed from "@/features/employee-notes/components/EmployeeNotesFeed";
import EmployeeNotesTimeline from "@/features/employee-notes/components/EmployeeNotesTimeline";
import CreateEmployeeNoteInline from "@/features/employee-notes/components/CreateEmployeeNoteInline";
import EmployeeHistoryFeed from "./EmployeeHistoryFeed";
import EmployeeHrTabView from "./EmployeeHrTabView";
import EmployeeEmergencyTabView from "./EmployeeEmergencyTabView";
import EmployeeContractsTab from "./EmployeeContractsTab";

interface EmployeeViewPageProps {
  employee: EmployeeDetail;
  notes: EmployeeNoteItem[];
  auditLog: EmployeeAuditLogItem[];
  hrProfile: EmployeeHrProfile | null;
  emergencyProfile: EmployeeEmergencyProfile | null;
  contracts: EmployeeContract[];
  employeeName: string;
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
  auditLog,
  hrProfile,
  emergencyProfile,
  contracts,
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

  const fullName = [user?.title, user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");

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
                <TabsTrigger className={tabCls} value="address">
                  {t("address")}
                </TabsTrigger>
                <TabsTrigger className={tabCls} value="hr">
                  {tE("hr.tabLabel")}
                </TabsTrigger>
                <TabsTrigger className={tabCls} value="emergency">
                  {tE("emergency.tabLabel")}
                </TabsTrigger>
                <TabsTrigger className={tabCls} value="logbook">
                  {tN("logbook")}
                </TabsTrigger>
                <TabsTrigger className={tabCls} value="documents">
                  {tE("attachments")}
                </TabsTrigger>
                <TabsTrigger className={tabCls} value="contracts">
                  {tE("contracts")}
                </TabsTrigger>
                <TabsTrigger className={tabCls} value="history">
                  {tE("history")}
                </TabsTrigger>
                <TabsTrigger className={tabCls} value="absences" disabled>
                  {t("absenceNotice")}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview — description list */}
            <TabsContent value="overview">
              <div className="px-4 sm:px-0">
                <h3 className="text-base/7 font-semibold text-foreground">
                  {tE("overview")}
                </h3>
              </div>
              <div className="mt-6 border-t border-border">
                <dl className="divide-y divide-border">
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("name")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {fullName || "–"}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("persona")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {t(membership?.persona ?? "EMPLOYEE")}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("email")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {user?.id ? (
                        <UserEmailField
                          userId={user.id}
                          currentEmail={primaryEmail}
                        />
                      ) : (
                        (primaryEmail ?? "–")
                      )}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("phone")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {membership?.contactPhone || "–"}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("dateOfBirth")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {formatDate(user?.dateOfBirth)}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("socialSecurityNumber")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {user?.socialSecurityNumber || "–"}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {tE("timeTrackingEnabled")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {employee.timeTrackingEnabled
                        ? t("active")
                        : t("inactive")}
                    </dd>
                  </div>
                  {membership?.organization && (
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm/6 font-medium text-foreground">
                        {t("organization")}
                      </dt>
                      <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                        {membership.organization.name}
                      </dd>
                    </div>
                  )}
                  {membership?.roles && membership.roles.length > 0 && (
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm/6 font-medium text-foreground">
                        {tE("roles")}
                      </dt>
                      <dd className="mt-1 sm:col-span-2 sm:mt-0">
                        <div className="flex flex-wrap gap-1.5">
                          {membership.roles.map((role) => (
                            <Badge
                              key={role.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {role.name ?? role.systemCode ?? "–"}
                            </Badge>
                          ))}
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

            </TabsContent>

            {/* Address */}
            <TabsContent value="address">
              <div className="px-4 sm:px-0">
                <h3 className="text-base/7 font-semibold text-foreground">
                  {t("address")}
                </h3>
              </div>
              <div className="mt-6 border-t border-border">
                <dl className="divide-y divide-border">
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("street")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {[user?.street, user?.houseNumber]
                        .filter(Boolean)
                        .join(" ") || "–"}
                    </dd>
                  </div>
                  {user?.addressLine2 && (
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm/6 font-medium text-foreground">
                        {t("addressLine2")}
                      </dt>
                      <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                        {user.addressLine2}
                      </dd>
                    </div>
                  )}
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("postalCode")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {[user?.postalCode, user?.city]
                        .filter(Boolean)
                        .join(" ") || "–"}
                    </dd>
                  </div>
                  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                    <dt className="text-sm/6 font-medium text-foreground">
                      {t("country")}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
                      {user?.country ? tCountries(user.country) : "–"}
                    </dd>
                  </div>
                </dl>
              </div>
            </TabsContent>

            {/* HR */}
            <TabsContent value="hr">
              <EmployeeHrTabView profile={hrProfile} />
            </TabsContent>

            {/* Notfall */}
            <TabsContent value="emergency">
              <EmployeeEmergencyTabView profile={emergencyProfile} />
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
              <div className="px-4 sm:px-0">
                <h3 className="text-base/7 font-semibold text-foreground">
                  {tE("attachments")}
                </h3>
              </div>
              <div className="mt-6 border-t border-border pt-6">
                <ul
                  role="list"
                  className="divide-y divide-border rounded-md border border-border"
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
              </div>
            </TabsContent>

            {/* Verträge */}
            <TabsContent value="contracts">
              <EmployeeContractsTab
                employeeId={employee.id}
                contracts={contracts}
                editable
              />
            </TabsContent>

            {/* History */}
            <TabsContent value="history">
              <div className="px-4 sm:px-0">
                <h3 className="text-base/7 font-semibold text-foreground">
                  {tE("history")}
                </h3>
                <p className="mt-1 max-w-2xl text-sm/6 text-muted-foreground">
                  {tE("historyDescription")}
                </p>
              </div>
              <div className="mt-6 border-t border-border pt-6">
                <EmployeeHistoryFeed logs={auditLog} />
              </div>
            </TabsContent>
          </Tabs>
  );
}
