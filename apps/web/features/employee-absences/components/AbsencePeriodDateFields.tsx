"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { DateTimeCalendarFormField } from "@/components/form/form-fields/DateTimeCalendarFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import {
  parseAbsenceDateTime,
  startOfLocalDay,
} from "@restart/shared-schemas/employee-absences/absence-date";

export function AbsencePeriodDateFields() {
  const { control, getValues, setValue } = useFormContext();

  const includesTime = useWatch({ control, name: "includesTime" }) as boolean;
  const startDate = useWatch({ control, name: "startDate" });

  const startDayFloor = (() => {
    const parsed = parseAbsenceDateTime(startDate);
    return parsed ? startOfLocalDay(parsed) : new Date("1900-01-01");
  })();

  const handleIncludesTimeChange = (checked: boolean) => {
    setValue("includesTime", checked, { shouldValidate: true });

    const start = parseAbsenceDateTime(getValues("startDate"));
    const end = parseAbsenceDateTime(getValues("endDate"));

    if (!checked) {
      if (start)
        setValue("startDate", startOfLocalDay(start), { shouldValidate: true });
      if (end)
        setValue("endDate", startOfLocalDay(end), { shouldValidate: true });
      return;
    }

    if (start) {
      const next = startOfLocalDay(start);
      next.setHours(8, 0, 0, 0);
      setValue("startDate", next, { shouldValidate: true });
    }
    if (end) {
      const next = startOfLocalDay(end);
      next.setHours(17, 0, 0, 0);
      setValue("endDate", next, { shouldValidate: true });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <SwitchFormField
        name="includesTime"
        label="absence.includesTime"
        description="absence.includesTimeHint"
        namespace="Employees"
        onCheckedChange={handleIncludesTimeChange}
      />

      <div className="grid items-start gap-4 sm:grid-cols-2">
        {includesTime ? (
          <>
            <DateTimeCalendarFormField
              name="startDate"
              label="startDate"
              minHour={0}
              maxHour={23}
            />
            <DateTimeCalendarFormField
              name="endDate"
              label="endDate"
              minHour={0}
              maxHour={23}
              disabledDate={(date) => {
                const day = startOfLocalDay(date);
                return day.getTime() < startDayFloor.getTime();
              }}
            />
          </>
        ) : (
          <>
            <DatePickerFormField
              name="startDate"
              label="startDate"
              startOfDay
              disabledDate={(date) => date < new Date("1900-01-01")}
            />
            <DatePickerFormField
              name="endDate"
              label="endDate"
              startOfDay
              disabledDate={(date) => {
                const day = startOfLocalDay(date);
                return day.getTime() < startDayFloor.getTime();
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
