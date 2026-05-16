"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, Phone, Mail, HeartPulse } from "lucide-react";
import type { EmployeeEmergencyProfile } from "../actions/get-employee-emergency-profile.action";

interface Props {
  profile: EmployeeEmergencyProfile | null;
}

const BLOOD_TYPE_DISPLAY: Record<string, string> = {
  A_POS: "A+",
  A_NEG: "A−",
  B_POS: "B+",
  B_NEG: "B−",
  AB_POS: "AB+",
  AB_NEG: "AB−",
  O_POS: "0+",
  O_NEG: "0−",
};

export default function EmployeeEmergencyTabView({ profile }: Props) {
  const tE = useTranslations("Employees");

  const enumLabel = (group: string, val?: string | null) =>
    val ? tE(`${group}.${val}`) : "–";

  const hasContact1 =
    profile?.contact1Name ||
    profile?.contact1Phone ||
    profile?.contact1Email ||
    profile?.contact1Relationship;
  const hasContact2 =
    profile?.contact2Name ||
    profile?.contact2Phone ||
    profile?.contact2Email ||
    profile?.contact2Relationship;

  return (
    <>
      {/* Hinweis: sensible Daten */}
      <div className="px-4 sm:px-0 mb-6">
        <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-900 dark:text-amber-200">
            {tE("emergency.sensitiveNotice")}
          </p>
        </div>
      </div>

      {/* Notfallkontakte */}
      <div className="px-4 sm:px-0">
        <h3 className="text-base/7 font-semibold text-foreground">
          {tE("emergency.contacts")}
        </h3>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ContactCard
          title={tE("emergency.contactPrimary")}
          name={profile?.contact1Name}
          relationship={enumLabel(
            "contactRelationship",
            profile?.contact1Relationship,
          )}
          phone={profile?.contact1Phone}
          email={profile?.contact1Email}
          empty={!hasContact1}
          emptyText={tE("emergency.noContact")}
        />
        <ContactCard
          title={tE("emergency.contactSecondary")}
          name={profile?.contact2Name}
          relationship={enumLabel(
            "contactRelationship",
            profile?.contact2Relationship,
          )}
          phone={profile?.contact2Phone}
          email={profile?.contact2Email}
          empty={!hasContact2}
          emptyText={tE("emergency.noContact")}
        />
      </div>

      {/* Gesundheit */}
      <div className="mt-10 px-4 sm:px-0">
        <h3 className="text-base/7 font-semibold text-foreground">
          {tE("emergency.healthInfo")}
        </h3>
      </div>
      <div className="mt-6 border-t border-border">
        <dl className="divide-y divide-border">
          <Row
            label={tE("emergency.bloodType")}
            value={
              profile?.bloodType
                ? (BLOOD_TYPE_DISPLAY[profile.bloodType] ?? profile.bloodType)
                : "–"
            }
          />
          <Row
            label={tE("emergency.allergies")}
            value={profile?.allergies || "–"}
          />
          <Row
            label={tE("emergency.chronicConditions")}
            value={profile?.chronicConditions || "–"}
          />
          <Row
            label={tE("emergency.medications")}
            value={profile?.emergencyMedications || "–"}
          />
          <Row
            label={tE("emergency.primaryDoctor")}
            value={
              profile?.primaryDoctorName || profile?.primaryDoctorPhone ? (
                <span>
                  {profile?.primaryDoctorName}
                  {profile?.primaryDoctorName && profile?.primaryDoctorPhone
                    ? " · "
                    : ""}
                  {profile?.primaryDoctorPhone}
                </span>
              ) : (
                "–"
              )
            }
          />
          <Row
            label={tE("emergency.pharmacy")}
            value={profile?.pharmacyName || "–"}
          />
        </dl>
      </div>
    </>
  );
}

interface ContactCardProps {
  title: string;
  name?: string | null;
  relationship: string;
  phone?: string | null;
  email?: string | null;
  empty: boolean;
  emptyText: string;
}
const ContactCard = ({
  title,
  name,
  relationship,
  phone,
  email,
  empty,
  emptyText,
}: ContactCardProps) => (
  <div className="rounded-lg border bg-card p-4">
    <div className="text-sm font-medium text-foreground">{title}</div>
    {empty ? (
      <div className="mt-2 text-sm text-muted-foreground">{emptyText}</div>
    ) : (
      <div className="mt-3 space-y-2">
        <div className="text-base font-semibold text-foreground">
          {name || "–"}
        </div>
        <div className="text-xs text-muted-foreground">{relationship}</div>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
          >
            <Phone className="h-4 w-4" /> {phone}
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
          >
            <Mail className="h-4 w-4" /> {email}
          </a>
        )}
      </div>
    )}
  </div>
);

interface RowProps {
  label: string;
  value: React.ReactNode;
}
const Row = ({ label, value }: RowProps) => (
  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
    <dt className="text-sm/6 font-medium text-foreground flex items-center gap-2">
      <HeartPulse className="h-4 w-4 text-muted-foreground" />
      {label}
    </dt>
    <dd className="mt-1 text-sm/6 text-muted-foreground sm:col-span-2 sm:mt-0 whitespace-pre-line">
      {value}
    </dd>
  </div>
);
