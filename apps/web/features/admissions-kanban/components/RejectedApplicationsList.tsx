"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudentAvatar } from "@/features/students/components/StudentAvatar";

import type { AdmissionRejectedBy, RejectedApplication } from "../types";

interface Props {
  applications: RejectedApplication[];
}

const rejectedByKey = (by: AdmissionRejectedBy): string => {
  switch (by) {
    case "SCHOOL":
      return "rejectedBySchool";
    case "PARENTS":
      return "rejectedByParents";
    case "OTHER":
    default:
      return "rejectedByOther";
  }
};

export function RejectedApplicationsList({ applications }: Props) {
  const t = useTranslations("Admissions");
  const router = useRouter();

  if (applications.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t("rejectedListEmpty")}
      </p>
    );
  }

  const dateFmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("listColChild")}</TableHead>
            <TableHead>{t("fieldFamilyName")}</TableHead>
            <TableHead>{t("fieldGradeLevel")}</TableHead>
            <TableHead>{t("rejectionReason")}</TableHead>
            <TableHead>{t("rejectedByLabel")}</TableHead>
            <TableHead className="text-right">{t("rejectedAtLabel")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((a) => (
            <TableRow
              key={a.id}
              className="cursor-pointer"
              onClick={() => router.push(`/admin/admissions/${a.id}`)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <StudentAvatar
                    studentId={a.id}
                    firstName={a.childFirstName}
                    lastName={a.childLastName}
                    className="h-7 w-7 shrink-0"
                    fallbackClassName="text-[10px]"
                  />
                  <span className="font-medium">
                    {a.childFirstName} {a.childLastName}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm">{a.familyName ?? "—"}</TableCell>
              <TableCell className="text-sm">
                {a.desiredGradeLevelName ?? "—"}
              </TableCell>
              <TableCell className="text-sm">
                {a.rejectionReasonLabel ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border"
                      style={{
                        backgroundColor:
                          a.rejectionReasonColor ?? "var(--muted)",
                      }}
                    />
                    {a.rejectionReasonLabel}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {a.rejectionReason ?? "—"}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {a.rejectedBy ? (
                  <Badge variant="outline" className="text-[10px]">
                    {t(rejectedByKey(a.rejectedBy))}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {dateFmt(a.rejectedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
