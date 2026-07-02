"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pencil, Paperclip } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/common/BackButton";
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

  return (
    <div className="min-h-full">
      <main className="py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8 mb-4">
          <BackButton
            href={ROUTES.admin.employees(locale)}
            label={tE("backToEmployees")}
          />
        </div>
        {/* Page header */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-7xl lg:px-8">
          <div className="flex items-center space-x-5">
            <div className="shrink-0">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {employeeName}
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                <span className="text-foreground">
                  {t(membership?.persona ?? "EMPLOYEE")}
                </span>
                {membership?.organization && (
                  <>
                    {" "}
                    {tE("at")}{" "}
                    <span className="text-foreground">
                      {membership.organization.name}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="mt-6 flex md:mt-0">
            <Button asChild>
              <Link
                href={`${ROUTES.admin.employeesEdit(locale, employee.id)}?tab=${activeTab}`}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {t("edit")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="overview">{tE("overview")}</TabsTrigger>
              <TabsTrigger value="address">{t("address")}</TabsTrigger>
              <TabsTrigger value="hr">{tE("hr.tabLabel")}</TabsTrigger>
              <TabsTrigger value="emergency">
                {tE("emergency.tabLabel")}
              </TabsTrigger>
              <TabsTrigger value="logbook">{tN("logbook")}</TabsTrigger>
              <TabsTrigger value="documents">{tE("attachments")}</TabsTrigger>
              <TabsTrigger value="contracts">{tE("contracts")}</TabsTrigger>
              <TabsTrigger value="history">{tE("history")}</TabsTrigger>
              <TabsTrigger value="absences" disabled>
                {t("absenceNotice")}
              </TabsTrigger>
            </TabsList>

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
        </div>
      </main>
    </div>
  );
}
