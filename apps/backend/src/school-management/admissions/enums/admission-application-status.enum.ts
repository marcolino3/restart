import { registerEnumType } from '@nestjs/graphql';

export enum AdmissionApplicationStatus {
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  ENROLLED = 'ENROLLED',
  ARCHIVED = 'ARCHIVED',
}

registerEnumType(AdmissionApplicationStatus, {
  name: 'AdmissionApplicationStatus',
  description:
    'Lifecycle status of an admission application — independent of the configurable stage.',
});
