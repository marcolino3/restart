import { registerEnumType } from '@nestjs/graphql';

export enum AdmissionActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
}

registerEnumType(AdmissionActivityType, {
  name: 'AdmissionActivityType',
});
