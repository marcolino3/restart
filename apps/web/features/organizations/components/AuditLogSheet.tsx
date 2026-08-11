"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getOrganizationAuditLogAction } from "../actions/get-organization-audit-log.action";
import { OrganizationAuditAction } from "@restart/shared-schemas/organizations/organization-enums";

interface AuditLogEntry {
  id: string;
  action: string;
  createdAt: string;
  actorUser?: { id: string; firstName: string; lastName: string } | null;
}

interface AuditLogSheetProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_SIZE = 25;

export const AuditLogSheet = ({
  organizationId,
  open,
  onOpenChange,
}: AuditLogSheetProps) => {
  const tO = useTranslations("Organizations");
  const locale = useLocale();
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadPage = async (nextOffset: number) => {
    setIsLoading(true);
    setLoadError(false);
    const result = await getOrganizationAuditLogAction(
      organizationId,
      PAGE_SIZE,
      nextOffset
    );
    setIsLoading(false);

    if (!result.success) {
      setLoadError(true);
      return;
    }

    setItems(result.data.items);
    setTotal(result.data.total);
    setOffset(nextOffset);
  };

  useEffect(() => {
    if (open) {
      loadPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, organizationId]);

  const hasNext = offset + PAGE_SIZE < total;
  const hasPrev = offset > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{tO("auditLogTitle")}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3 px-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && loadError && (
            <p className="text-sm text-destructive">{tO("auditLogLoadError")}</p>
          )}

          {!isLoading && !loadError && items.length === 0 && (
            <p className="text-sm text-muted-foreground">{tO("auditLogEmpty")}</p>
          )}

          {!isLoading &&
            !loadError &&
            items.map((item) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {tO(
                      `auditAction_${item.action}` as `auditAction_${OrganizationAuditAction}`
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(item.createdAt))}
                  </span>
                </div>
                {item.actorUser && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.actorUser.firstName} {item.actorUser.lastName}
                  </p>
                )}
              </div>
            ))}

          {!isLoading && !loadError && (hasPrev || hasNext) && (
            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasPrev}
                onClick={() => loadPage(Math.max(0, offset - PAGE_SIZE))}
              >
                {"<"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasNext}
                onClick={() => loadPage(offset + PAGE_SIZE)}
              >
                {">"}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
