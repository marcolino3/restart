import type { EmployeeOnboardingFormOutput } from "../schemas/employee-onboarding-form.schema";
import { resolveContractScheduleFields } from "./resolve-contract-schedule";
const emptyToNull = (s: string | null | undefined) => s === undefined ? undefined : s?.trim() || null;
export const ONBOARDING_CONTRACT_FIELDS = ['contractType', 'position', 'startDate', 'endDate', 'probationEndDate', 'workloadPercent', 'weeklyHours', 'annualVacationDays', 'grossSalary', 'hourlyRate', 'paymentInterval', 'has13thSalary', 'weekdayTimeWindows', 'weekdayWorkloads', 'documentUrl'];

const toIsoDate = (d: Date | string | null | undefined): string | undefined => {
  if (!d) return undefined;
  if (typeof d === "string") return d.split("T")[0] || undefined;
  return d.toISOString().split("T")[0];
};

const emptyToUndef = (s: string | null | undefined): string | undefined =>
  s && s.trim() ? s.trim() : undefined;

/** Maps the wizard form output onto the EmployeeOnboardingInput GraphQL shape. */
export function toOnboardingInput(values: EmployeeOnboardingFormOutput, changedFields?: string[]) {
  const schedule = resolveContractScheduleFields(values);

  const contract = {
    contractType: values.contractType || undefined,
    position: emptyToUndef(values.position),
    startDate: toIsoDate(values.startDate),
    endDate: toIsoDate(values.endDate),
    probationEndDate: toIsoDate(values.probationEndDate),
    workloadPercent: values.workloadPercent ?? undefined,
    weeklyHours: emptyToUndef(values.weeklyHours),
    annualVacationDays: values.annualVacationDays ?? undefined,
    grossSalary: values.grossSalary ?? undefined,
    hourlyRate: values.hourlyRate ?? undefined,
    paymentInterval: values.paymentInterval || undefined,
    has13thSalary: values.has13thSalary ?? undefined,
    weekdayTimeWindows: schedule.weekdayTimeWindows,
    weekdayWorkloads: schedule.weekdayWorkloads,
    documentUrl: emptyToUndef(values.documentUrl),
  };
  const hasContract = Object.values(contract).some((v) => v !== undefined && v !== null);

  const result = {
    id: values.id,
    expectedVersion: values.version,
    title: emptyToNull(values.title),
    firstName: values.firstName,
    lastName: values.lastName,
    email: emptyToNull(values.email),
    persona: values.persona,
    dateOfBirth: values.dateOfBirth === undefined ? undefined : values.dateOfBirth === null ? null : typeof values.dateOfBirth === "string" ? values.dateOfBirth : `${values.dateOfBirth.getFullYear()}-${String(values.dateOfBirth.getMonth() + 1).padStart(2, "0")}-${String(values.dateOfBirth.getDate()).padStart(2, "0")}`,
    socialSecurityNumber: emptyToNull(values.socialSecurityNumber),
    privateEmail: emptyToNull(values.privateEmail),
    contactPhone: emptyToNull(values.contactPhone),
    contactPhone2: emptyToNull(values.contactPhone2),
    street: emptyToNull(values.street),
    houseNumber: emptyToNull(values.houseNumber),
    addressLine2: emptyToNull(values.addressLine2),
    postalCode: emptyToNull(values.postalCode),
    city: emptyToNull(values.city),
    country: emptyToNull(values.country),
    avatarUrl: emptyToNull(values.avatarUrl),
    timeTrackingEnabled: values.timeTrackingEnabled,
    teamId: values.teamId ?? undefined,
    roleIds: values.roleId ? [values.roleId] : [],
    language: values.language,
    ...(hasContract ? { contract } : {}),
  };
  if (!changedFields) return result;
  const changed = new Set(changedFields);
  return Object.fromEntries(Object.entries(result).filter(([key]) =>
    ['id', 'expectedVersion', 'firstName', 'lastName'].includes(key) ||
    (key === 'roleIds' ? changed.has('roleId') : key === 'contract' ? ONBOARDING_CONTRACT_FIELDS.some((field) => changed.has(field)) : changed.has(key)),
  ));
}
