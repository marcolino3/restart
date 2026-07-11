import { ShieldAlert } from "lucide-react";

interface Props {
  /** Already-translated notice text. */
  children: React.ReactNode;
}

/**
 * Dezenter Hinweis-Banner für besondere Kategorien personenbezogener Daten
 * (DSGVO Art. 9) — Amber-Muster analog `EmployeeEmergencyTabView`. Über
 * Feldgruppen mit sensiblen Feldern (Religion, AHV-Nr., Gesundheit …) rendern.
 */
export function SensitiveDataNotice({ children }: Props) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p className="text-sm text-amber-900 dark:text-amber-200">{children}</p>
    </div>
  );
}
