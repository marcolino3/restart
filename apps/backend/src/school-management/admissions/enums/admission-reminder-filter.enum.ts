import { registerEnumType } from '@nestjs/graphql';

export enum AdmissionReminderFilter {
  OVERDUE = 'OVERDUE',
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  OPEN = 'OPEN',
  COMPLETED = 'COMPLETED',
}

registerEnumType(AdmissionReminderFilter, {
  name: 'AdmissionReminderFilter',
});
