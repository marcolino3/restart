/**
 * Placeholder tokens a contract template may reference. Must stay in sync
 * with the backend `CONTRACT_TEMPLATE_PLACEHOLDERS`
 * (apps/backend/src/employee-management/contract-templates/contract-placeholders.ts).
 * `labelKey` resolves in the `ContractTemplates` i18n namespace.
 */
export const CONTRACT_TEMPLATE_PLACEHOLDERS: Array<{
  token: string;
  labelKey: string;
}> = [
  { token: "employeeFullName", labelKey: "phEmployeeFullName" },
  { token: "employeeFirstName", labelKey: "phEmployeeFirstName" },
  { token: "employeeLastName", labelKey: "phEmployeeLastName" },
  { token: "employeeAddress", labelKey: "phEmployeeAddress" },
  { token: "employeeDateOfBirth", labelKey: "phEmployeeDateOfBirth" },
  { token: "employeeSsn", labelKey: "phEmployeeSsn" },
  { token: "position", labelKey: "phPosition" },
  { token: "contractType", labelKey: "phContractType" },
  { token: "startDate", labelKey: "phStartDate" },
  { token: "endDate", labelKey: "phEndDate" },
  { token: "probationEndDate", labelKey: "phProbationEndDate" },
  { token: "workloadPercent", labelKey: "phWorkloadPercent" },
  { token: "weeklyHours", labelKey: "phWeeklyHours" },
  { token: "grossSalary", labelKey: "phGrossSalary" },
  { token: "hourlyRate", labelKey: "phHourlyRate" },
  { token: "annualVacationDays", labelKey: "phAnnualVacationDays" },
  { token: "orgName", labelKey: "phOrgName" },
  { token: "orgAddress", labelKey: "phOrgAddress" },
  { token: "todayDate", labelKey: "phTodayDate" },
];

/**
 * Sample data for the live preview — placeholders are swapped for realistic
 * values so editors see a filled contract while typing. Purely fictional.
 */
export const PLACEHOLDER_SAMPLE_VALUES: Record<string, string> = {
  employeeFullName: "Anna Muster",
  employeeFirstName: "Anna",
  employeeLastName: "Muster",
  employeeAddress: "Musterstrasse 12, 8000 Zürich",
  employeeDateOfBirth: "12.04.1990",
  employeeSsn: "756.1234.5678.97",
  position: "Lehrperson Primarstufe",
  contractType: "Unbefristet",
  startDate: "01.08.2026",
  endDate: "31.07.2027",
  probationEndDate: "31.10.2026",
  workloadPercent: "80 %",
  weeklyHours: "33.6",
  grossSalary: "CHF 78'000.00",
  hourlyRate: "CHF 45.00",
  annualVacationDays: "25",
  orgName: "Musterschule Zürich",
  orgAddress: "Schulweg 1, 8000 Zürich",
  todayDate: new Date().toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }),
};

/** Replaces every {{token}} with its sample value (unknown tokens stay visible). */
export function fillSampleValues(html: string): string {
  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, token: string) =>
    Object.prototype.hasOwnProperty.call(PLACEHOLDER_SAMPLE_VALUES, token)
      ? PLACEHOLDER_SAMPLE_VALUES[token]
      : match,
  );
}
