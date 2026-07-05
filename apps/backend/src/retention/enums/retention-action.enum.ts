import { registerEnumType } from '@nestjs/graphql';

/**
 * What to do when the retention period lapses. ANONYMIZE keeps statistically
 * useful, de-identified rows where a legal basis to retain the record exists
 * (e.g. payroll); DELETE removes it entirely.
 */
export enum RetentionAction {
  DELETE = 'DELETE',
  ANONYMIZE = 'ANONYMIZE',
}

registerEnumType(RetentionAction, {
  name: 'RetentionAction',
  description: 'Action taken when the retention period lapses',
});
