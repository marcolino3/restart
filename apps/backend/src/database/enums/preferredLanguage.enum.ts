import { registerEnumType } from '@nestjs/graphql';

export enum PreferredLanguage {
  DE = 'DE',
  EN = 'EN',
}

registerEnumType(PreferredLanguage, {
  name: 'PreferredLanguage',
  description: 'Supported preferred languages',
});
