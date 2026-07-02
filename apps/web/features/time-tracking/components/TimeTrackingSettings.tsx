"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { useSheet } from "@/components/providers/sheet-provider";
import { HolidayForm } from "./HolidayForm";
import { CompanyVacationForm } from "./CompanyVacationForm";
import {
  deleteHolidayAction,
  deleteCompanyVacationAction,
  type CompanyVacation,
  type Holiday,
} from "../actions/settings.action";

interface Props {
  holidays: Holiday[];
  companyVacations: CompanyVacation[];
}

const fmt = (d: string) => format(new Date(d), "dd.MM.yyyy", { locale: de });

export const TimeTrackingSettings = ({ holidays, companyVacations }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { open } = useSheet();

  return (
    <div className="space-y-10">
      {/* Feiertage */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("holidays")}</h2>
          <Button
            size="sm"
            onClick={() =>
              open({ title: t("addHoliday"), content: <HolidayForm /> })
            }
          >
            <Plus className="size-4" /> {t("addHoliday")}
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("holidayName")}</TableHead>
                <TableHead className="text-right">
                  {t("paidPercentage")}
                </TableHead>
                <TableHead>{t("canton")}</TableHead>
                <TableHead className="text-right">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-16 text-center">
                    {tc("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                holidays.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{fmt(h.date)}</TableCell>
                    <TableCell>{h.name}</TableCell>
                    <TableCell className="text-right">
                      {h.paidPercentage}%
                    </TableCell>
                    <TableCell>{h.canton ?? "–"}</TableCell>
                    <TableCell className="text-right">
                      <DeleteConfirmationDialog
                        onConfirm={async () => {
                          const r = await deleteHolidayAction(h.id);
                          return { success: r.success, error: r.error };
                        }}
                        onSuccess={() => router.refresh()}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Betriebsferien */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("companyVacations")}</h2>
          <Button
            size="sm"
            onClick={() =>
              open({
                title: t("addCompanyVacation"),
                content: <CompanyVacationForm />,
              })
            }
          >
            <Plus className="size-4" /> {t("addCompanyVacation")}
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("startDate")}</TableHead>
                <TableHead>{t("endDate")}</TableHead>
                <TableHead className="text-right">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companyVacations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center">
                    {tc("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                companyVacations.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{fmt(c.startDate)}</TableCell>
                    <TableCell>{fmt(c.endDate)}</TableCell>
                    <TableCell className="text-right">
                      <DeleteConfirmationDialog
                        onConfirm={async () => {
                          const r = await deleteCompanyVacationAction(c.id);
                          return { success: r.success, error: r.error };
                        }}
                        onSuccess={() => router.refresh()}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
};
