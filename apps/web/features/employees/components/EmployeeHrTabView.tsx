"use client";

import { useTranslations } from "next-intl";
import type { EmployeeHrProfile } from "../actions/get-employee-hr-profile.action";

interface Props {
  profile: EmployeeHrProfile | null;
}

export default function EmployeeHrTabView({ profile }: Props) {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const tCountries = useTranslations("Countries");

  const enumLabel = (group: string, val?: string | null) =>
    val ? tE(`${group}.${val}`) : "–";

  const yesNo = (b?: boolean | null) =>
    b == null ? "–" : b ? t("yes") : t("no");

  const nationalityLabel = profile?.nationality
    ? (() => {
        try {
          return tCountries(profile.nationality);
        } catch {
          return profile.nationality;
        }
      })()
    : "–";

  return (
    <>
      {/* Bankverbindung */}
      <Section title={tE("hr.bankAccount")}>
        <Row label={tE("hr.iban")} value={profile?.iban || "–"} />
        <Row
          label={tE("hr.bankAccountHolder")}
          value={profile?.bankAccountHolder || "–"}
        />
        <Row label={tE("hr.bankName")} value={profile?.bankName || "–"} />
      </Section>

      {/* Versicherungen & Steuern */}
      <Section title={tE("hr.insurances")} mt>
        <Row label={tE("hr.bvgProvider")} value={profile?.bvgProvider || "–"} />
        <Row
          label={tE("hr.bvgInsuranceNumber")}
          value={profile?.bvgInsuranceNumber || "–"}
        />
        <Row label={tE("hr.uvgProvider")} value={profile?.uvgProvider || "–"} />
        <Row
          label={tE("hr.withholdingTaxCode")}
          value={profile?.withholdingTaxCode || "–"}
        />
      </Section>

      {/* Stammdaten */}
      <Section title={tE("hr.personalData")} mt>
        <Row label={tE("hr.nationality")} value={nationalityLabel} />
        <Row
          label={tE("hr.residencePermitType")}
          value={enumLabel("residencePermitType", profile?.residencePermitType)}
        />
        <Row
          label={tE("hr.residencePermitValidUntil")}
          value={
            profile?.residencePermitValidUntil
              ? new Date(profile.residencePermitValidUntil).toLocaleDateString(
                  "de-CH",
                  { day: "2-digit", month: "long", year: "numeric" },
                )
              : "–"
          }
        />
        <Row
          label={tE("hr.maritalStatus")}
          value={enumLabel("maritalStatus", profile?.maritalStatus)}
        />
        <Row label={tE("hr.denomination")} value={profile?.denomination || "–"} />
        <Row
          label={tE("hr.numberOfChildren")}
          value={profile?.numberOfChildren ?? "–"}
        />
      </Section>

      {/* Ferien */}
      <Section title={tE("hr.vacation")} mt>
        <Row
          label={tE("hr.annualVacationDays")}
          value={profile?.annualVacationDays ?? "–"}
        />
        <Row
          label={tE("hr.remainingVacationDays")}
          value={profile?.remainingVacationDays ?? "–"}
        />
      </Section>

      {/* Onboarding / Compliance */}
      <Section title={tE("hr.onboardingCompliance")} mt>
        <Row
          label={tE("hr.onboardingStatus")}
          value={enumLabel("onboardingStatus", profile?.onboardingStatus)}
        />
        <Row label={tE("hr.ndaSigned")} value={yesNo(profile?.ndaSigned)} />
        <Row
          label={tE("hr.criminalRecordSubmitted")}
          value={yesNo(profile?.criminalRecordSubmitted)}
        />
      </Section>
    </>
  );
}

interface SectionProps {
  title: string;
  mt?: boolean;
  children: React.ReactNode;
}
const Section = ({ title, mt, children }: SectionProps) => (
  <>
    <div className={`${mt ? "mt-10" : ""} px-4 sm:px-0`}>
      <h3 className="text-base/7 font-semibold text-foreground">{title}</h3>
    </div>
    <div className="mt-6 border-t border-border">
      <dl className="divide-y divide-border">{children}</dl>
    </div>
  </>
);

interface RowProps {
  label: string;
  value: React.ReactNode;
}
const Row = ({ label, value }: RowProps) => (
  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
    <dt className="text-sm/6 font-medium text-foreground">{label}</dt>
    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0">
      {value}
    </dd>
  </div>
);
