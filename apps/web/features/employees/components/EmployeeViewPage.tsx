"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Pencil, ArrowLeft, Paperclip } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineEditField } from "@/components/inline-edit/InlineEditField";
import { InlineEditSelect } from "@/components/inline-edit/InlineEditSelect";
import { InlineEditDate } from "@/components/inline-edit/InlineEditDate";
import { ROUTES } from "@/constants/routes";
import { Persona } from "@/gql/graphql";

import type { EmployeeDetail } from "../actions/get-employee-by-id.action";
import type { EmployeeNoteItem } from "@/features/employee-notes/actions/get-employee-notes.action";
import { updateEmployeeFieldAction } from "../actions/update-employee-field.action";
import EmployeeNotesFeed from "@/features/employee-notes/components/EmployeeNotesFeed";
import EmployeeNotesTimeline from "@/features/employee-notes/components/EmployeeNotesTimeline";
import CreateEmployeeNoteInline from "@/features/employee-notes/components/CreateEmployeeNoteInline";

interface EmployeeViewPageProps {
  employee: EmployeeDetail;
  notes: EmployeeNoteItem[];
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
  employeeName,
}: EmployeeViewPageProps) {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const tN = useTranslations("EmployeeNotes");
  const locale = useLocale();
  const router = useRouter();

  const user = employee.membership?.user;
  const membership = employee.membership;
  const primaryEmail = user?.userEmails?.find((e) => e.isPrimary)?.email;

  const handleFieldUpdate = async (field: string, value: string) => {
    const result = await updateEmployeeFieldAction(employee.id, field, value);
    if (result.success) {
      toast.success(t("saved"));
      router.refresh();
    } else {
      toast.error(t("error"));
      throw new Error("Update failed");
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "–";
    return new Date(dateStr).toLocaleDateString("de-CH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-full">
      <main className="py-10">
        {/* Page header */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-7xl lg:px-8">
          <div className="flex items-center space-x-5">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => router.push(ROUTES.admin.employees(locale))}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="shrink-0">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full shadow-inner"
                />
              </div>
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
          <div className="mt-6 flex flex-col-reverse justify-stretch space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
            <Button variant="outline" asChild>
              <Link href={ROUTES.admin.employees(locale)}>
                {t("cancel")}
              </Link>
            </Button>
            <Button asChild>
              <Link href={ROUTES.admin.employeesEdit(locale, employee.id)}>
                <Pencil className="h-4 w-4 mr-2" />
                {t("edit")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-6 sm:px-6 lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2 lg:col-start-1">
            {/* Description list */}
            <section>
              <div className="bg-card shadow-sm sm:rounded-lg border">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg/6 font-medium text-foreground">
                    {tE("employeeInformation")}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    {tE("employeeDetails")}
                  </p>
                </div>
                <div className="border-t border-border px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-muted-foreground">
                        {t("firstName")}
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        <InlineEditField
                          value={user?.firstName ?? ""}
                          onSave={(v) => handleFieldUpdate("firstName", v)}
                        />
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-muted-foreground">
                        {t("lastName")}
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        <InlineEditField
                          value={user?.lastName ?? ""}
                          onSave={(v) => handleFieldUpdate("lastName", v)}
                        />
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-muted-foreground">
                        {t("email")}
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        {primaryEmail ?? "–"}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-muted-foreground">
                        {t("phone")}
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        <InlineEditField
                          value={membership?.contactPhone ?? ""}
                          onSave={(v) => handleFieldUpdate("contactPhone", v)}
                          inputType="tel"
                        />
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-muted-foreground">
                        {t("title")}
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        <InlineEditSelect
                          value={user?.title ?? ""}
                          displayValue={user?.title ?? "–"}
                          options={[
                            { value: "Herr", label: t("titleMr") },
                            { value: "Frau", label: t("titleMs") },
                          ]}
                          onSave={(v) => handleFieldUpdate("title", v)}
                        />
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-muted-foreground">
                        {t("persona")}
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        <InlineEditSelect
                          value={membership?.persona ?? "EMPLOYEE"}
                          displayValue={t(membership?.persona ?? "EMPLOYEE")}
                          options={Object.values(Persona).map((p) => ({
                            value: p,
                            label: t(p),
                          }))}
                          onSave={(v) => handleFieldUpdate("persona", v)}
                        />
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-muted-foreground">
                        {t("dateOfBirth")}
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        <InlineEditDate
                          value={user?.dateOfBirth}
                          displayValue={formatDate(user?.dateOfBirth)}
                          onSave={(v) => handleFieldUpdate("dateOfBirth", v)}
                        />
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-muted-foreground">
                        {tE("timeTrackingEnabled")}
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        <InlineEditSelect
                          value={employee.timeTrackingEnabled ? "true" : "false"}
                          displayValue={
                            employee.timeTrackingEnabled
                              ? t("active")
                              : t("inactive")
                          }
                          options={[
                            { value: "true", label: t("active") },
                            { value: "false", label: t("inactive") },
                          ]}
                          onSave={(v) =>
                            handleFieldUpdate(
                              "timeTrackingEnabled",
                              v,
                            )
                          }
                        />
                      </dd>
                    </div>
                    {membership?.roles && membership.roles.length > 0 && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-muted-foreground">
                          {tE("roles")}
                        </dt>
                        <dd className="mt-1 flex flex-wrap gap-1.5">
                          {membership.roles.map((role) => (
                            <Badge
                              key={role.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {role.name ?? role.systemCode ?? "–"}
                            </Badge>
                          ))}
                        </dd>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-muted-foreground">
                        {tE("attachments")}
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        <ul className="divide-y divide-border rounded-md border border-border">
                          <li className="flex items-center justify-between py-3 pr-4 pl-3 text-sm">
                            <div className="flex w-0 flex-1 items-center">
                              <Paperclip className="h-5 w-5 shrink-0 text-muted-foreground" />
                              <span className="ml-2 w-0 flex-1 truncate">
                                arbeitsvertrag_2024.pdf
                              </span>
                            </div>
                            <div className="ml-4 shrink-0">
                              <a
                                href="#"
                                className="font-medium text-primary hover:text-primary/80"
                              >
                                Download
                              </a>
                            </div>
                          </li>
                          <li className="flex items-center justify-between py-3 pr-4 pl-3 text-sm">
                            <div className="flex w-0 flex-1 items-center">
                              <Paperclip className="h-5 w-5 shrink-0 text-muted-foreground" />
                              <span className="ml-2 w-0 flex-1 truncate">
                                zeugnis_2024.pdf
                              </span>
                            </div>
                            <div className="ml-4 shrink-0">
                              <a
                                href="#"
                                className="font-medium text-primary hover:text-primary/80"
                              >
                                Download
                              </a>
                            </div>
                          </li>
                        </ul>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <Link
                    href={ROUTES.admin.employeesEdit(locale, employee.id)}
                    className="block bg-muted/50 px-4 py-4 text-center text-sm font-medium text-muted-foreground hover:text-foreground sm:rounded-b-lg"
                  >
                    {tE("viewFullProfile")}
                  </Link>
                </div>
              </div>
            </section>

            {/* Notes */}
            <section>
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
            </section>
          </div>

          {/* Timeline sidebar */}
          <section className="lg:col-span-1 lg:col-start-3">
            <EmployeeNotesTimeline notes={notes} />
          </section>
        </div>
      </main>
    </div>
  );
}
