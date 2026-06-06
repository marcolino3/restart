import { registerEnumType } from '@nestjs/graphql';

/** Who initiated the rejection of an admission application. */
export enum AdmissionRejectedBy {
  SCHOOL = 'SCHOOL',
  PARENTS = 'PARENTS',
  OTHER = 'OTHER',
}

registerEnumType(AdmissionRejectedBy, {
  name: 'AdmissionRejectedBy',
  description:
    'Party that initiated the rejection of an admission application (school, parents, or other).',
});
