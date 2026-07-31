"use client";

import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeAvatar } from "@/features/employees/components/EmployeeAvatar";
import { TeacherOption } from "../actions/get-teachers.action";

type TeacherAssignmentValue = {
  employeeId: string;
  role?: "LEAD" | "ASSISTANT";
  workloadPercent?: number | string | null;
};

interface Props {
  /** Field array name — "teachers" in both the create and the edit form. */
  name: string;
  teachers: TeacherOption[];
}

const teacherName = (t: TeacherOption) =>
  `${t.firstName} ${t.lastName}`.trim();

/**
 * Assigns teachers to a class, each with a role and an optional workload.
 *
 * Several LEAD teachers are allowed on purpose — co-teaching and job sharing
 * (two class teachers at 60/60 %) are the normal case, so this is a role per
 * row rather than a single "is primary" toggle.
 *
 * Validity is not edited here. The backend dates a new assignment from today
 * and closes one that disappears, so the history maintains itself without the
 * form having to reason about dates.
 */
export function TeacherAssignmentField({ name, teachers }: Props) {
  const t = useTranslations("SchoolClasses");
  const { control, register, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  const byId = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  // `fields` is the source of truth for what is rendered — it is what
  // append/remove actually mutate. The watched values are only read for the
  // role badge, which has to reflect edits made after the initial render.
  const rows = (watch(name) as TeacherAssignmentValue[] | undefined) ?? [];
  const assignedIds = new Set(
    (fields as unknown as TeacherAssignmentValue[]).map((f) => f.employeeId),
  );
  const available = teachers.filter((teacher) => !assignedIds.has(teacher.id));

  return (
    <div className="space-y-3" data-testid="teacher-assignments">
      {fields.map((field, index) => {
        const employeeId = (field as unknown as TeacherAssignmentValue)
          .employeeId;
        const teacher = byId.get(employeeId);

        return (
          <div
            key={field.id}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <EmployeeAvatar
              firstName={teacher?.firstName}
              lastName={teacher?.lastName}
              className="size-9 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {teacher ? teacherName(teacher) : t("unknownTeacher")}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Controller
                  control={control}
                  name={`${name}.${index}.role`}
                  render={({ field: roleField }) => (
                    <Select
                      value={roleField.value ?? "LEAD"}
                      onValueChange={roleField.onChange}
                    >
                      <SelectTrigger
                        className="h-8 w-[170px] text-sm"
                        aria-label={t("role")}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LEAD">{t("roleLead")}</SelectItem>
                        <SelectItem value="ASSISTANT">
                          {t("roleAssistant")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <input
                  type="hidden"
                  {...register(`${name}.${index}.employeeId`)}
                  defaultValue={employeeId}
                />

                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="—"
                    aria-label={t("workloadPercent")}
                    className="h-8 w-20 text-sm"
                    {...register(`${name}.${index}.workloadPercent`)}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            {rows[index]?.role === "LEAD" && (
              <Badge variant="secondary" className="shrink-0">
                {t("roleLead")}
              </Badge>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label={t("removeTeacher")}
              onClick={() => remove(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
        );
      })}

      {available.length > 0 ? (
        <Select
          value=""
          onValueChange={(employeeId) =>
            append({ employeeId, role: "LEAD", workloadPercent: "" })
          }
        >
          <SelectTrigger className="w-full" aria-label={t("assignTeacher")}>
            <SelectValue placeholder={t("assignTeacher")} />
          </SelectTrigger>
          <SelectContent>
            {available.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacherName(teacher)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        // Without this the picker just vanishes once everyone is assigned,
        // which reads as a missing feature rather than an empty list.
        <p className="text-sm text-muted-foreground">
          {fields.length > 0 ? t("allTeachersAssigned") : t("noTeachers")}
        </p>
      )}
    </div>
  );
}
