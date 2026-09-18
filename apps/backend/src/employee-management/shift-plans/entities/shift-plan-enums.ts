import { registerEnumType } from '@nestjs/graphql';

export enum ShiftPlanStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}
registerEnumType(ShiftPlanStatus, { name: 'ShiftPlanStatus' });

export enum ShiftPlanSource {
  MANUAL = 'MANUAL',
  AI = 'AI',
}
registerEnumType(ShiftPlanSource, { name: 'ShiftPlanSource' });
