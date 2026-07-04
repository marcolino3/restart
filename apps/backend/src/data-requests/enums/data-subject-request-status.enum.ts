import { registerEnumType } from '@nestjs/graphql';

/**
 * Lifecycle of a data-subject request. COMPLETED / REJECTED are terminal and
 * stamp `resolvedAt` (proof the statutory deadline was met).
 */
export enum DataSubjectRequestStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

registerEnumType(DataSubjectRequestStatus, {
  name: 'DataSubjectRequestStatus',
  description: 'Lifecycle status of a data-subject request',
});
