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
