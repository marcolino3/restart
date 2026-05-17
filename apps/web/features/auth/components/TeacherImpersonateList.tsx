"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { LogIn, Shield } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/features/users/context/current-user.context";

import { impersonateUserAction } from "../actions/impersonate-user.action";

export type ImpersonatableTeacher = {
  employeeId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
};

interface Props {
  teachers: ImpersonatableTeacher[];
}

/**
 * SuperAdmin-only listing of the school class's teachers with a
 * "log in as …" dropdown per row. The impersonation swaps the
 * browser's session cookie; the new tab opens with the target user's
 * session.
 */
export function TeacherImpersonateList({ teachers }: Props) {
  const t = useTranslations("Impersonation");
  const user = useUser();
  const [isPending, startTransition] = useTransition();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  if (!user?.isSuperAdmin) return null;

  const handleImpersonate = (target: ImpersonatableTeacher) => {
    if (!target.userId) {
      toast.error(t("noUserLinked"));
      return;
    }
    setPendingUserId(target.userId);
    startTransition(async () => {
      const res = await impersonateUserAction(target.userId!);
      setPendingUserId(null);
      if (!res.success) {
        toast.error(t("error"), { description: res.error });
        return;
      }
      // The session cookie for the current browser was replaced.
      // Open a new tab pointing at /admin so the SuperAdmin can browse
      // as the impersonated user. The current tab will also reflect the
      // new identity on next navigation/refresh.
      const locale = window.location.pathname.split("/")[1] || "de";
      window.open(`/${locale}/admin`, "_blank", "noopener,noreferrer");
      toast.success(t("openedNewTab"), {
        description: t("currentTabHint"),
      });
    });
  };

  if (teachers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-600" />
          {t("title")}
          <Badge variant="outline" className="text-[10px]">
            SuperAdmin
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1.5">
          {teachers.map((teacher) => (
            <li
              key={teacher.employeeId}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
            >
              <span className="text-sm flex-1 truncate">
                {teacher.firstName} {teacher.lastName}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending && pendingUserId === teacher.userId}
                  >
                    <LogIn className="mr-2 h-3.5 w-3.5" />
                    {isPending && pendingUserId === teacher.userId
                      ? "…"
                      : t("function")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleImpersonate(teacher)}
                    disabled={!teacher.userId || isPending}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {teacher.userId
                      ? t("loginAs", { name: teacher.firstName })
                      : t("noUserLinked")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
