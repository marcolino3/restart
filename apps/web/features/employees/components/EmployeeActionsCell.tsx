"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LogIn, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { impersonateUserAction } from "@/features/auth/actions/impersonate-user.action";
import { useUser } from "@/features/users/context/current-user.context";

import type { EmployeeListItem } from "../actions/get-employees.action";

interface Props {
  row: EmployeeListItem;
}

export function EmployeeActionsCell({ row }: Props) {
  const t = useTranslations("Common");
  const tI = useTranslations("Impersonation");
  const locale = useLocale();
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const employee = row.membership.employee;
  const target = row.membership.user;
  const targetUserId = target?.id;
  const firstName = target?.firstName ?? "";

  const handleImpersonate = () => {
    if (!targetUserId) {
      toast.error(tI("noUserLinked"));
      return;
    }
    setOpen(false);
    startTransition(async () => {
      const res = await impersonateUserAction(targetUserId);
      if (!res.success) {
        toast.error(tI("error"), { description: res.error });
        return;
      }
      const loc = window.location.pathname.split("/")[1] || "de";
      window.open(`/${loc}/admin`, "_blank", "noopener,noreferrer");
      toast.success(tI("openedNewTab"), {
        description: tI("currentTabHint"),
      });
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">{t("openMenu")}</span>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {employee?.id && (
          <DropdownMenuItem asChild>
            <Link
              href={ROUTES.admin.employeesEdit(locale, employee.id)}
              className="flex gap-2"
            >
              <Pencil className="h-4 w-4" /> {t("edit")}
            </Link>
          </DropdownMenuItem>
        )}

        {user?.isSuperAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleImpersonate}
              disabled={!targetUserId || isPending}
              className="cursor-pointer"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {targetUserId
                ? tI("loginAs", { name: firstName || tI("function") })
                : tI("noUserLinked")}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
          <Trash2 className="h-4 w-4 mr-2" />
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
