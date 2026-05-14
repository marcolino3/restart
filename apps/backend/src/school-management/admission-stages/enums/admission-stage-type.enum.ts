import { registerEnumType } from '@nestjs/graphql';

export enum AdmissionStageType {
  INITIAL = 'INITIAL',
  IN_PROGRESS = 'IN_PROGRESS',
  ACCEPTED = 'ACCEPTED',
  ENROLLED = 'ENROLLED',
  REJECTED = 'REJECTED',
}

registerEnumType(AdmissionStageType, {
  name: 'AdmissionStageType',
  description:
    'Lifecycle category of an admission stage — drives generic logic independent of stage names',
});
