import { SystemEmployeeAbsenceCategory } from '../interfaces/system-employee-absence-categories.enum';

export const SYSTEM_EMPLOYEE_ABSENCE_CATEGORIES: {
  code: SystemEmployeeAbsenceCategory;
}[] = [
  { code: SystemEmployeeAbsenceCategory.SICKNESS },
  { code: SystemEmployeeAbsenceCategory.ACCIDENT },
  { code: SystemEmployeeAbsenceCategory.CHILDCARE_SICK },
  { code: SystemEmployeeAbsenceCategory.TRAINING },
  { code: SystemEmployeeAbsenceCategory.FUNERAL },
  { code: SystemEmployeeAbsenceCategory.MOVE },
  { code: SystemEmployeeAbsenceCategory.MILITARY_SERVICE },
  { code: SystemEmployeeAbsenceCategory.CIVIL_SERVICE },
  { code: SystemEmployeeAbsenceCategory.OTHER },
];
