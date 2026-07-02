/** Minuten → "H:MM" (Vorzeichen bleibt erhalten, z.B. -12:30). */
export const formatDurationMinutes = (minutes: number): string => {
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return `${sign}${hours}:${mins.toString().padStart(2, "0")}`;
};

/** Minuten → "12.5 h" (eine Nachkommastelle). */
export const formatDurationHours = (minutes: number): string =>
  `${(minutes / 60).toFixed(1)} h`;
