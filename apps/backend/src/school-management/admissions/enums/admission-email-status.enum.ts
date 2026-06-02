import { registerEnumType } from '@nestjs/graphql';

export enum AdmissionEmailStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

registerEnumType(AdmissionEmailStatus, {
  name: 'AdmissionEmailStatus',
});
