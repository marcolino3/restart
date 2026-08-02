import { Locale } from '@/database/enums/locale.enum';

export type DefaultEmployeeFunctionTranslations = Record<
  Locale,
  { name: string }
>;

export type DefaultEmployeeFunctionDef = {
  /** Stable DE canonical name — used for idempotent seeding. */
  deName: string;
  translations: DefaultEmployeeFunctionTranslations;
};

export const DEFAULT_EMPLOYEE_FUNCTIONS: DefaultEmployeeFunctionDef[] = [
  {
    deName: 'Klassenleitung',
    translations: {
      [Locale.DE]: { name: 'Klassenleitung' },
      [Locale.FR]: { name: 'Direction de classe' },
      [Locale.IT]: { name: 'Direzione di classe' },
      [Locale.EN]: { name: 'Class teacher' },
    },
  },
  {
    deName: 'Lehrperson',
    translations: {
      [Locale.DE]: { name: 'Lehrperson' },
      [Locale.FR]: { name: 'Enseignant·e' },
      [Locale.IT]: { name: 'Docente' },
      [Locale.EN]: { name: 'Teacher' },
    },
  },
  {
    deName: 'Assistenz',
    translations: {
      [Locale.DE]: { name: 'Assistenz' },
      [Locale.FR]: { name: 'Assistance' },
      [Locale.IT]: { name: 'Assistenza' },
      [Locale.EN]: { name: 'Assistant' },
    },
  },
  {
    deName: 'Pädagog:in Kinderhaus',
    translations: {
      [Locale.DE]: { name: 'Pädagog:in Kinderhaus' },
      [Locale.FR]: { name: 'Éducateur·trice crèche' },
      [Locale.IT]: { name: 'Educatore/trice asilo' },
      [Locale.EN]: { name: 'Early years educator' },
    },
  },
  {
    deName: 'Sekretariat',
    translations: {
      [Locale.DE]: { name: 'Sekretariat' },
      [Locale.FR]: { name: 'Secrétariat' },
      [Locale.IT]: { name: 'Segreteria' },
      [Locale.EN]: { name: 'Office staff' },
    },
  },
  {
    deName: 'Schulleitung',
    translations: {
      [Locale.DE]: { name: 'Schulleitung' },
      [Locale.FR]: { name: 'Direction d\'école' },
      [Locale.IT]: { name: 'Direzione scolastica' },
      [Locale.EN]: { name: 'School leadership' },
    },
  },
];

/** @deprecated Use DEFAULT_EMPLOYEE_FUNCTIONS */
export const DEFAULT_EMPLOYEE_FUNCTION_NAMES = DEFAULT_EMPLOYEE_FUNCTIONS.map(
  (d) => d.deName,
);
