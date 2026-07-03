"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";
import { getStudentContactPersonsAction } from "@/features/contact-persons/actions/get-student-contact-persons.action";

import { ConsentMatrix } from "./ConsentMatrix";
import { getConsentPurposesAction } from "../actions/get-consent-purposes.action";
import { getConsentsForSubjectAction } from "../actions/get-consents-for-subject.action";
import type { ConsentPurpose, Consent } from "../types";
import type { ConsentSubjectType } from "../schemas/consent-purpose-form.schema";

const NS = "ConsentManagement";

type Guardian = { id: string; name: string; hasCustody: boolean; isPrimary: boolean };

/**
 * Self-loading consent section for a subject detail page. Lazily fetches the
 * org's purposes + the subject's consents (and, for a child, the custodial
 * guardians) when mounted, and re-fetches after each record/withdraw.
 */
export function ConsentTab({
  subjectType,
  subjectId,
}: {
  subjectType: ConsentSubjectType;
  subjectId: string;
}) {
  const t = useTranslations(NS);
  const [loading, setLoading] = useState(true);
  const [purposes, setPurposes] = useState<ConsentPurpose[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [guardianId, setGuardianId] = useState<string | undefined>(undefined);

  const refreshConsents = useCallback(async () => {
    const res = await getConsentsForSubjectAction(subjectType, subjectId);
    setConsents(res.data);
  }, [subjectType, subjectId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const [purposesRes, consentsRes, guardianList] = await Promise.all([
        getConsentPurposesAction(),
        getConsentsForSubjectAction(subjectType, subjectId),
        subjectType === "STUDENT"
          ? getStudentContactPersonsAction(subjectId)
          : Promise.resolve(null),
      ]);

      let g: Guardian[] = [];
      if (guardianList && guardianList.success) {
        const mapped = guardianList.data.map((l) => ({
          id: l.contactPerson.id,
          name: `${l.contactPerson.firstName} ${l.contactPerson.lastName}`.trim(),
          hasCustody: l.hasCustody,
          isPrimary: l.isPrimaryContact,
        }));
        const custodial = mapped.filter((x) => x.hasCustody);
        g = custodial.length ? custodial : mapped;
      }

      if (!active) return;
      setPurposes(purposesRes.data);
      setConsents(consentsRes.data);
      setGuardians(g);
      setGuardianId(g.find((x) => x.isPrimary)?.id ?? g[0]?.id);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [subjectType, subjectId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("tabConsent")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("subjectConsentSubtitle")}
        </p>
      </div>

      {subjectType === "STUDENT" &&
        (guardians.length ? (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("guardianLabel")}</span>
            <select
              value={guardianId ?? ""}
              onChange={(e) => setGuardianId(e.target.value)}
              className="rounded-ctl border bg-background px-2 py-1 text-sm"
            >
              {guardians.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                  {g.hasCustody ? "" : ` (${t("noCustody")})`}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm text-status-amber-foreground">
            {t("noGuardian")}
          </p>
        ))}

      <ConsentMatrix
        subjectType={subjectType}
        subjectId={subjectId}
        purposes={purposes}
        consents={consents}
        guardianContactPersonId={
          subjectType === "STUDENT" ? guardianId : undefined
        }
        onChanged={refreshConsents}
      />
    </div>
  );
}
