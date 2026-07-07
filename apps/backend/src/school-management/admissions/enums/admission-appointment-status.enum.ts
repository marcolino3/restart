import { registerEnumType } from '@nestjs/graphql';

export enum AdmissionAppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  // Postponed with no new date fixed yet ("wird verschoben").
  RESCHEDULING = 'RESCHEDULING',
}

registerEnumType(AdmissionAppointmentStatus, {
  name: 'AdmissionAppointmentStatus',
  description: 'Lifecycle status of an admission appointment.',
});
