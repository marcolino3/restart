import { formatDurationMinutes } from "@/lib/formatting/duration";

/**
 * Minuten → "H:MM" mit explizitem Vorzeichen für Salden:
 * +4:30 / -4:12 / ±0:00 (Design-Handoff Zeitauswertung).
 */
export const formatSignedDurationMinutes = (minutes: number): string => {
  if (minutes > 0) return `+${formatDurationMinutes(minutes)}`;
  if (minutes < 0) return formatDurationMinutes(minutes);
  return `±${formatDurationMinutes(0)}`;
};
