type CountryCode = string | null | undefined;

const CH_PLACEHOLDER = "756.1234.5678.97";
const CH_PREFIX = "756.";
const CH_MAX_LENGTH = 16;

const CH_ALIASES = new Set([
  "CH",
  "SCHWEIZ",
  "SWITZERLAND",
  "SUISSE",
  "SVIZZERA",
  "SVIZRA",
]);

export const isSwitzerland = (country: CountryCode): boolean =>
  Boolean(country && CH_ALIASES.has(country.trim().toUpperCase()));

const formatCh = (input: string): string => {
  const raw = input.replace(/\D/g, "");
  const digits = (raw.startsWith("756") ? raw : `756${raw}`).slice(0, 13);
  if (digits.length === 0) return "";

  const parts: string[] = [digits.slice(0, 3)];
  if (digits.length > 3) parts.push(digits.slice(3, 7));
  if (digits.length > 7) parts.push(digits.slice(7, 11));
  if (digits.length > 11) parts.push(digits.slice(11, 13));
  return parts.join(".");
};

const isValidCh = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 13 || !digits.startsWith("756")) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = Number(digits[i]);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(digits[12]);
};

export const formatSocialSecurityNumber = (
  country: CountryCode,
  input: string,
): string => {
  if (isSwitzerland(country)) return formatCh(input);
  return input;
};

export const socialSecurityNumberPlaceholder = (
  country: CountryCode,
): string | undefined => {
  if (isSwitzerland(country)) return CH_PLACEHOLDER;
  return undefined;
};

export const socialSecurityNumberMaxLength = (
  country: CountryCode,
): number | undefined => {
  if (isSwitzerland(country)) return CH_MAX_LENGTH;
  return undefined;
};

export const socialSecurityNumberPrefix = (
  country: CountryCode,
): string | undefined => {
  if (isSwitzerland(country)) return CH_PREFIX;
  return undefined;
};

export const isValidSocialSecurityNumber = (
  country: CountryCode,
  value: string,
): boolean => {
  if (!value) return true;
  if (isSwitzerland(country)) return isValidCh(value);
  return true;
};
