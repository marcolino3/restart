import { registerEnumType } from '@nestjs/graphql';

export enum AdmissionAppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(AdmissionAppointmentStatus, {
  name: 'AdmissionAppointmentStatus',
  description: 'Lifecycle status of an admission appointment.',
});
