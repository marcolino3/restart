"use client";

import { useTranslations } from "next-intl";
import { FieldResourceProvider } from "@/components/form/field-resource-context";
import { Row } from "@/components/common/Row";
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
    <FieldResourceProvider resource="employeeHrProfile" mode="update">
      {/* Bankverbindung */}
      <Section title={tE("hr.bankAccount")}>
        <Row label={tE("hr.iban")} value={profile?.iban || "–"} field="iban" />
        <Row
          label={tE("hr.bankAccountHolder")}
          value={profile?.bankAccountHolder || "–"}
          field="bankAccountHolder"
        />
        <Row
          label={tE("hr.bankName")}
          value={profile?.bankName || "–"}
          field="bankName"
        />
      </Section>

      {/* Persönliche Versicherungs-/Steuer-Daten */}
      <Section title={tE("hr.insurances")} mt>
        <Row
          label={tE("hr.bvgInsuranceNumber")}
          value={profile?.bvgInsuranceNumber || "–"}
          field="bvgInsuranceNumber"
        />
        <Row
          label={tE("hr.withholdingTaxCode")}
          value={profile?.withholdingTaxCode || "–"}
          field="withholdingTaxCode"
        />
      </Section>

      {/* Stammdaten */}
      <Section title={tE("hr.personalData")} mt>
        <Row
          label={tE("hr.nationality")}
          value={nationalityLabel}
          field="nationality"
        />
        <Row
          label={tE("hr.residencePermitType")}
          value={enumLabel("residencePermitType", profile?.residencePermitType)}
          field="residencePermitType"
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
          field="residencePermitValidUntil"
        />
        <Row
          label={tE("hr.maritalStatus")}
          value={enumLabel("maritalStatus", profile?.maritalStatus)}
          field="maritalStatus"
        />
        <Row
          label={tE("hr.denomination")}
          value={profile?.denomination || "–"}
          field="denomination"
        />
        <Row
          label={tE("hr.numberOfChildren")}
          value={profile?.numberOfChildren ?? "–"}
          field="numberOfChildren"
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
    </FieldResourceProvider>
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
