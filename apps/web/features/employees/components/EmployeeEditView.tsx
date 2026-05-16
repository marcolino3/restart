"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormActionButtons } from "@/components/form/form-fields/FormActionButtons";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";
import { Persona } from "@/gql/graphql";

import type { EmployeeDetail } from "../actions/get-employee-by-id.action";
import type { EmployeeAuditLogItem } from "../actions/get-employee-audit-log.action";
import type { EmployeeHrProfile } from "../actions/get-employee-hr-profile.action";
import type { EmployeeEmergencyProfile } from "../actions/get-employee-emergency-profile.action";
import EmployeeHrTabEdit from "./EmployeeHrTabEdit";
import EmployeeEmergencyTabEdit from "./EmployeeEmergencyTabEdit";
import {
  EmployeeFormSchema,
  EmployeeFormOutput,
} from "../schemas/employee-form.schema";
import { updateEmployeeAction } from "../actions/update-employee.action";
import {
  PersonalEmploymentSection,
  AddressSection,
} from "./EmployeeFormSections";
import EmployeeHistoryFeed from "./EmployeeHistoryFeed";

interface Props {
  employee: EmployeeDetail;
  orgCountry: string | null;
  auditLog: EmployeeAuditLogItem[];
  hrProfile: EmployeeHrProfile | null;
  emergencyProfile: EmployeeEmergencyProfile | null;
  employeeName: string;
}

// Map RHF field names → tab value where the field lives, so we can jump there on validation error
const FIELD_TO_TAB: Record<string, "overview" | "address"> = {
  title: "overview",
  firstName: "overview",
  lastName: "overview",
  dateOfBirth: "overview",
  socialSecurityNumber: "overview",
  contactPhone: "overview",
  persona: "overview",
  timeTrackingEnabled: "overview",
  street: "address",
  houseNumber: "address",
  addressLine2: "address",
  postalCode: "address",
  city: "address",
  country: "address",
};

function getInitials(firstName?: string, lastName?: string): string {
  return (
    (firstName?.charAt(0)?.toUpperCase() ?? "") +
      (lastName?.charAt(0)?.toUpperCase() ?? "") || "?"
  );
}

export default function EmployeeEditView({
  employee,
  orgCountry,
  auditLog,
  hrProfile,
  emergencyProfile,
  employeeName,
}: Props) {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const tN = useTranslations("EmployeeNotes");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get("tab") ?? "overview",
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const user = employee.membership?.user;
  const membership = employee.membership;

  const form = useForm({
    resolver: zodResolver(EmployeeFormSchema),
    defaultValues: {
      id: employee.id,
      title: user?.title ?? "",
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: undefined,
      persona: (membership?.persona as Persona) ?? Persona.Employee,
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : null,
      socialSecurityNumber: user?.socialSecurityNumber ?? "",
      contactPhone: membership?.contactPhone ?? "",
      timeTrackingEnabled: employee.timeTrackingEnabled ?? false,
      street: user?.street ?? "",
      houseNumber: user?.houseNumber ?? "",
      addressLine2: user?.addressLine2 ?? "",
      postalCode: user?.postalCode ?? "",
      city: user?.city ?? "",
      country: user?.country ?? orgCountry ?? "",
    },
  });

  const onValid = async (values: Record<string, unknown>) => {
    await handleAction({
      action: () => updateEmployeeAction(values as EmployeeFormOutput),
      successMessage: tE("employeeUpdated"),
      errorMessage: tE("employeeUpdateError"),
      onSuccess: () => {
        router.push(
          `${ROUTES.admin.employeesView(locale, employee.id)}?tab=${activeTab}`,
        );
      },
    });
  };

  const onInvalid = (errors: Record<string, unknown>) => {
    console.warn("Employee form validation errors:", errors);
    const firstField = Object.keys(errors)[0];
    if (firstField && FIELD_TO_TAB[firstField]) {
      setActiveTab(FIELD_TO_TAB[firstField]);
    }
    toast.error(tE("validationError"));
  };

  return (
    <div className="min-h-full">
      <main className="py-10">
        {/* Page header — identical to view page */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-7xl lg:px-8">
          <div className="flex items-center space-x-5">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() =>
                router.push(ROUTES.admin.employeesView(locale, employee.id))
              }
              aria-label={t("back")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="shrink-0">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {tE("editEmployee")} – {employeeName}
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
              <Link
                href={`${ROUTES.admin.employeesView(locale, employee.id)}?tab=${activeTab}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                {t("view")}
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
              <TabsTrigger value="documents" disabled>
                {tE("attachments")}
              </TabsTrigger>
              <TabsTrigger value="history">{tE("history")}</TabsTrigger>
              <TabsTrigger value="absences" disabled>
                {t("absenceNotice")}
              </TabsTrigger>
              <TabsTrigger value="contracts" disabled>
                {tE("contracts")}
              </TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onValid, onInvalid)}>
                <TabsContent value="overview">
                  <div className="px-4 sm:px-0">
                    <h3 className="text-base/7 font-semibold text-foreground">
                      {tE("overview")}
                    </h3>
                  </div>
                  <div className="mt-6">
                    <PersonalEmploymentSection
                      employee={employee}
                      orgCountry={orgCountry}
                      isEdit
                    />
                  </div>
                  <FormActionButtons
                    disabled={form.formState.isSubmitting}
                    onCancel={() =>
                      router.push(
                        ROUTES.admin.employeesView(locale, employee.id),
                      )
                    }
                  />
                </TabsContent>

                <TabsContent value="address">
                  <div className="px-4 sm:px-0">
                    <h3 className="text-base/7 font-semibold text-foreground">
                      {t("address")}
                    </h3>
                  </div>
                  <div className="mt-6">
                    <AddressSection />
                  </div>
                  <FormActionButtons
                    disabled={form.formState.isSubmitting}
                    onCancel={() =>
                      router.push(
                        ROUTES.admin.employeesView(locale, employee.id),
                      )
                    }
                  />
                </TabsContent>
              </form>
            </Form>

            <TabsContent value="hr">
              <EmployeeHrTabEdit
                employeeId={employee.id}
                profile={hrProfile}
              />
            </TabsContent>

            <TabsContent value="emergency">
              <EmployeeEmergencyTabEdit
                employeeId={employee.id}
                profile={emergencyProfile}
              />
            </TabsContent>

            <TabsContent value="logbook">
              <Card>
                <CardHeader>
                  <CardTitle>{tN("logbook")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {tE("comingSoon")}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

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
