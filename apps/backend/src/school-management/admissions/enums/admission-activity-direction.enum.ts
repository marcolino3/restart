import { registerEnumType } from '@nestjs/graphql';

export enum AdmissionActivityDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

registerEnumType(AdmissionActivityDirection, {
  name: 'AdmissionActivityDirection',
});
