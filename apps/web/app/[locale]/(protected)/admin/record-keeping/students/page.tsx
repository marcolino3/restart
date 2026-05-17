import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";

import { StudentAvatar } from "@/features/students/components/StudentAvatar";
import { getClassroomStudentsAction } from "@/features/record-keeping/actions/get-classroom-students.action";
import { getMyTeachingSchoolClassesAction } from "@/features/school-classes/actions/get-my-teaching-school-classes.action";

interface PageProps {
  searchParams: Promise<{ classId?: string }>;
}

const StudentsPage = async ({ searchParams }: PageProps) => {
  const { classId } = await searchParams;
  const t = await getTranslations("RecordKeeping");
  const locale = await getLocale();

  const classesRes = await getMyTeachingSchoolClassesAction();
  const classes = classesRes.success
    ? classesRes.data
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((c) => ({ id: c.id, name: c.name }))
    : [];

  const selectedClassId =
    classId && classes.some((c) => c.id === classId)
      ? classId
      : classes[0]?.id;

  // Lightweight: only enrollments for the active class — no per-lesson
  // aggregates. Detailed counts/lifecycles are loaded on demand when a
  // single student is opened (`/students/[studentId]`).
  const studentsRes = selectedClassId
    ? await getClassroomStudentsAction(selectedClassId)
    : null;
  const students = studentsRes?.success ? studentsRes.data : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">{t("studentsTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("studentsSubtitle")}</p>
      </div>

      {!selectedClassId ? (
        <p className="text-sm text-muted-foreground italic">
          {t("selectClassFirst")}
        </p>
      ) : studentsRes && !studentsRes.success ? (
        <p className="text-sm text-destructive">
          {studentsRes.error ?? "Failed to load"}
        </p>
      ) : students.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          {t("noStudentsInClassroom")}
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("studentsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {students.map((s) => {
                const base = ROUTES.admin.recordKeepingStudent(
                  locale,
                  s.studentId,
                );
                const href = selectedClassId
                  ? `${base}?classId=${selectedClassId}`
                  : base;
                return (
                  <li key={s.studentId}>
                    <Link
                      href={href}
                      prefetch
                      className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 hover:bg-accent transition"
                    >
                      <StudentAvatar
                        studentId={s.studentId}
                        firstName={s.firstName}
                        lastName={s.lastName}
                        className="h-9 w-9"
                      />
                      <span className="flex-1 truncate text-sm">
                        <span className="font-medium">{s.firstName}</span>{" "}
                        <span className="text-muted-foreground">
                          {s.lastName}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentsPage;
