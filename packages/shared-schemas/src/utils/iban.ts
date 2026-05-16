/**
 * IBAN helpers (ISO 13616).
 *
 * IBAN is a global standard — country-specific lengths range from 15 (Norway)
 * to 34 (max). Mask is generic: 2 letters (country) + 2 digits (check) +
 * up to 30 alphanumeric BBAN characters. We validate via mod-97 (= 1).
 */

export const IBAN_MASK = "aa99 **** **** **** **** **** **** **";
export const IBAN_PLACEHOLDER = "CH93 0076 2011 6238 5295 7";
export const IBAN_MAX_LENGTH = 42; // 34 chars + up to 8 spaces

const stripIban = (value: string): string =>
  value.replace(/\s+/g, "").toUpperCase();

/** Format with a space every 4 chars for display. */
export const formatIban = (value: string): string => {
  const compact = stripIban(value);
  return compact.match(/.{1,4}/g)?.join(" ") ?? compact;
};

/** Convert IBAN to integer-string for mod-97: move 4 leading chars to end + letters → 10..35. */
const ibanNumericString = (iban: string): string => {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let out = "";
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      out += ch;
    } else if (code >= 65 && code <= 90) {
      out += String(code - 55);
    } else {
      return "";
    }
  }
  return out;
};

/** Mod-97 over a very long integer string (avoids BigInt for tree-shake-friendliness). */
const mod97 = (numeric: string): number => {
  let remainder = 0;
  for (const ch of numeric) {
    remainder = (remainder * 10 + (ch.charCodeAt(0) - 48)) % 97;
  }
  return remainder;
};

export const isValidIban = (value: string): boolean => {
  if (!value) return true;
  const compact = stripIban(value);
  if (compact.length < 15 || compact.length > 34) return false;
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(compact)) return false;
  const numeric = ibanNumericString(compact);
  if (!numeric) return false;
  return mod97(numeric) === 1;
};
