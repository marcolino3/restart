import { Persona } from "@restart/shared-types/graphql";
import type { WeekdayTimeWindows } from "@restart/shared-schemas/employees/employee-onboarding-form.schema";
import type { EmployeeOnboardingFormType } from "../schemas/employee-onboarding-form.schema";
import type { EmployeeDetail } from "../actions/get-employee-by-id.action";
import type { EmployeeContract } from "../actions/employee-contracts.actions";
import type { EmployeeFunctionItem } from "@/features/employee-functions/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function resolvePositionForForm(
  position: string | null | undefined,
  functions: EmployeeFunctionItem[],
): string {
  if (!position) return "";
  if (UUID_RE.test(position)) return position;
  const match = functions.find((f) => f.name === position);
  return match?.id ?? position;
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pickCurrentContract(
  contracts: EmployeeContract[],
): EmployeeContract | undefined {
  const todayIso = new Date().toISOString().slice(0, 10);
  return [...contracts]
    .filter((c) => c.isActive && c.startDate && c.startDate.slice(0, 10) <= todayIso)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0];
}

function mapWeekdayTimeWindows(
  raw?: EmployeeContract["weekdayTimeWindows"],
): WeekdayTimeWindows | undefined {
  if (!raw) return undefined;
  const keys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const out: WeekdayTimeWindows = {};
  for (const key of keys) {
    const windows = raw[key];
    if (windows?.length) out[key] = windows;
  }
  return Object.keys(out).length ? out : undefined;
}

export function mapEmployeeToOnboardingForm(input: {
  employee: EmployeeDetail;
  contracts: EmployeeContract[];
  teamId?: string | null;
  orgCountry?: string | null;
  locale: string;
  employeeFunctions?: EmployeeFunctionItem[];
}): EmployeeOnboardingFormType {
  const { employee, contracts, teamId, orgCountry, locale, employeeFunctions = [] } =
    input;
  const user = employee.membership?.user;
  const membership = employee.membership;
  const contract = pickCurrentContract(contracts) ?? contracts[0];
  const primaryEmail =
    user?.userEmails?.find((e) => e.isPrimary)?.email ??
    user?.userEmails?.[0]?.email ??
    "";

  return {
    id: employee.id,
    title: user?.title ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: primaryEmail,
    persona: (membership?.persona as Persona) ?? Persona.Employee,
    dateOfBirth: parseDate(user?.dateOfBirth),
    socialSecurityNumber: user?.socialSecurityNumber ?? "",
    privateEmail: user?.privateEmail ?? "",
    contactPhone: membership?.contactPhone ?? "",
    contactPhone2: membership?.contactPhone2 ?? "",
    street: user?.street ?? "",
    houseNumber: user?.houseNumber ?? "",
    addressLine2: user?.addressLine2 ?? "",
    postalCode: user?.postalCode ?? "",
    city: user?.city ?? "",
    country: user?.country ?? orgCountry ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    timeTrackingEnabled: employee.timeTrackingEnabled ?? false,
    contractType: contract?.contractType ?? "",
    position: resolvePositionForForm(contract?.position, employeeFunctions),
    startDate: parseDate(contract?.startDate),
    endDate: parseDate(contract?.endDate),
    workloadPercent: contract?.workloadPercent ?? undefined,
    weeklyHours: contract?.weeklyHours ?? "",
    annualVacationDays: contract?.annualVacationDays ?? undefined,
    weekdayTimeWindows: mapWeekdayTimeWindows(contract?.weekdayTimeWindows) ?? {},
    documentUrl: contract?.documentUrl ?? "",
    teamId: teamId ?? undefined,
    roleId: membership?.roles?.[0]?.id,
    language: membership?.language ?? user?.language ?? (locale === "en" ? "en" : "de"),
    invitationTiming: "MANUAL",
  };
}
