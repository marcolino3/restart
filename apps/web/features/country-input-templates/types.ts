export type CountryInputFieldType = "PHONE" | "IBAN" | "SSN" | "POSTAL_CODE";

export type CountryInputValidatorKind =
  | "NONE"
  | "IBAN_MOD97"
  | "CH_SSN"
  | "REGEX";

export type CountryInputTemplate = {
  id: string;
  countryCode: string;
  fieldType: CountryInputFieldType;
  mask: string;
  placeholder?: string | null;
  maxLength?: number | null;
  regex?: string | null;
  prefix?: string | null;
  validatorKind: CountryInputValidatorKind;
};
