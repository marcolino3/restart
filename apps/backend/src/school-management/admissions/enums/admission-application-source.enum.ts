import { registerEnumType } from '@nestjs/graphql';

export enum AdmissionApplicationSource {
  MANUAL = 'MANUAL',
  PUBLIC_FORM = 'PUBLIC_FORM',
  OPEN_DAY = 'OPEN_DAY',
  REFERRAL = 'REFERRAL',
  OTHER = 'OTHER',
}

registerEnumType(AdmissionApplicationSource, {
  name: 'AdmissionApplicationSource',
  description: 'Where the application originated from.',
});
