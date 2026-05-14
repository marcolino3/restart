import { registerEnumType } from '@nestjs/graphql';

export enum CurriculumLocale {
  DE = 'DE',
  FR = 'FR',
  EN = 'EN',
  IT = 'IT',
}

registerEnumType(CurriculumLocale, {
  name: 'CurriculumLocale',
  description: 'Supported locales for curriculum content',
});
