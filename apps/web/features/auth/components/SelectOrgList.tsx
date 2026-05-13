"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";

type Organization = {
  id: string;
  name: string;
  subdomain?: string | null;
};

interface SelectOrgListProps {
  organizations: Organization[];
}

export function SelectOrgList({ organizations }: SelectOrgListProps) {
  const locale = useLocale();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(orgId: string) {
    setBusyId(orgId);
    setError(null);
    try {
      const res = await fetch("/api/org/switch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      if (!res.ok) {
        setError(`Wechsel fehlgeschlagen (${res.status})`);
        return;
      }
      window.location.assign(`/${locale}/admin`);
    } catch {
      setError("Netzwerkfehler beim Wechsel der Organisation");
    } finally {
      setBusyId(null);
    }
  }

  if (organizations.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Du bist aktuell in keiner Organisation Mitglied. Bitte kontaktiere
        deinen Administrator.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {organizations.map((org) => (
        <Button
          key={org.id}
          variant="outline"
          className="h-auto justify-between px-4 py-3 text-left"
          disabled={busyId !== null}
          onClick={() => handleSelect(org.id)}
        >
          <span className="flex flex-col items-start">
            <span className="font-medium">{org.name}</span>
            {org.subdomain && (
              <span className="text-xs text-muted-foreground">
                {org.subdomain}
              </span>
            )}
          </span>
          {busyId === org.id && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
        </Button>
      ))}
    </div>
  );
}
