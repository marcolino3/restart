"use client";

import * as React from "react";
import { Mail, Phone, Search, Users, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { EmployeeListItem } from "../actions/get-employees.action";
import { EmployeeAvatar } from "./EmployeeAvatar";

interface Props {
  data: EmployeeListItem[];
}

function getPrimaryEmail(item: EmployeeListItem) {
  const emails = item.membership.user?.userEmails ?? [];
  return emails.find((e) => e.isPrimary)?.email ?? emails[0]?.email ?? null;
}

export const EmployeesCardGrid = ({ data }: Props) => {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const [query, setQuery] = React.useState("");

  const normalized = query.trim().toLowerCase();
  const filtered = React.useMemo(() => {
    if (!normalized) return data;
    return data.filter((item) => {
      const first = item.membership.user?.firstName?.toLowerCase() ?? "";
      const last = item.membership.user?.lastName?.toLowerCase() ?? "";
      const full = `${first} ${last}`.trim();
      return (
        first.includes(normalized) ||
        last.includes(normalized) ||
        full.includes(normalized)
      );
    });
  }, [data, normalized]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 py-4">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tE("filterByName")}
            className="pl-9"
          />
        </div>
        {query.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuery("")}
          >
            {t("resetFilters")}
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
        <div className="ml-auto text-sm text-muted-foreground">
          {filtered.length} {t("results")}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border py-12 text-center text-muted-foreground">
          {t("noResults")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => {
            const user = item.membership.user;
            const empId = item.membership.employee?.id;
            const email = getPrimaryEmail(item);
            const phone = item.membership.contactPhone;
            const firstName = user?.firstName ?? "";
            const lastName = user?.lastName ?? "";
            const fullName = `${firstName} ${lastName}`.trim() || "—";
            const persona = item.membership.persona;
            const seed = user?.id ?? empId ?? fullName;
            const teams = (item.teamMembers ?? [])
              .map((tm) => tm.team)
              .filter((tt): tt is { id: string; name: string } => !!tt);

            return (
              <Card
                key={user?.id ?? empId ?? fullName}
                className="h-full"
              >
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <EmployeeAvatar
                    seed={seed}
                    firstName={firstName}
                    lastName={lastName}
                    className="h-20 w-20"
                    fallbackClassName="text-lg"
                  />
                  <div className="space-y-1">
                    <div className="font-semibold leading-tight">
                      {fullName}
                    </div>
                    <Badge variant="secondary">{t(persona)}</Badge>
                  </div>
                  {teams.length > 0 && (
                    <div className="flex w-full flex-wrap items-center justify-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {teams.map((team) => (
                        <Badge key={team.id} variant="outline">
                          {team.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex w-full flex-col gap-1.5 text-sm">
                    {email ? (
                      <a
                        href={`mailto:${email}`}
                        className="flex items-center gap-2 truncate text-muted-foreground hover:text-foreground hover:underline"
                      >
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{email}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground/60">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span>—</span>
                      </div>
                    )}
                    {phone ? (
                      <a
                        href={`tel:${phone}`}
                        className="flex items-center gap-2 truncate text-muted-foreground hover:text-foreground hover:underline"
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        <span className="truncate">{phone}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground/60">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>—</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
