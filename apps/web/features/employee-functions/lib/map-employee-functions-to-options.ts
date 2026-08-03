import type { EmployeeFunctionItem } from "@/features/employee-functions/types";
import { pickEmployeeFunctionName } from "@/features/employee-functions/types";

/** Dropdown options for contract position — value is the function id. */
export function mapEmployeeFunctionsToOptions(
  functions: EmployeeFunctionItem[],
  locale: string,
): { label: string; value: string }[] {
  return functions.map((fn) => ({
    label: pickEmployeeFunctionName(fn, locale),
    value: fn.id,
  }));
}
