import { registerEnumType } from '@nestjs/graphql';

export enum Locale {
  DE = 'DE',
  FR = 'FR',
  IT = 'IT',
  EN = 'EN',
}

registerEnumType(Locale, {
  name: 'Locale',
  description: 'Supported content locales (Schweizer Markt: DE/FR/IT + EN)',
});
