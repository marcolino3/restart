/** Matches a signed "H:MM" or plain hours string, e.g. "-12:30", "8:00", "5". */
export const SIGNED_DURATION_REGEX = /^[+-]?\d{1,4}(:[0-5]\d)?$/;

/** "-12:30" → -750, "8:00" → 480, "5" → 300 (hours only). */
export const parseSignedDurationToMinutes = (value: string): number => {
  const trimmed = value.trim();
  const negative = trimmed.startsWith("-");
  const unsigned = trimmed.replace(/^[+-]/, "");
  const [hoursPart, minutesPart] = unsigned.split(":");
  const minutes =
    parseInt(hoursPart, 10) * 60 +
    (minutesPart ? parseInt(minutesPart, 10) : 0);
  return negative ? -minutes : minutes;
};
