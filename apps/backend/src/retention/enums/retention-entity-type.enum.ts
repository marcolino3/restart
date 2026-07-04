import { registerEnumType } from '@nestjs/graphql';

/**
 * The kind of record a retention policy governs. Due-count preview is currently
 * computed for STUDENT (anchor: exitDate) and DATA_SUBJECT_REQUEST (anchor:
 * resolvedAt); other types can still be configured (documentation) and gain a
 * preview as anchors are wired up.
 */
export enum RetentionEntityType {
  STUDENT = 'STUDENT',
  EMPLOYEE = 'EMPLOYEE',
  CONTACT_PERSON = 'CONTACT_PERSON',
  ADMISSION_APPLICATION = 'ADMISSION_APPLICATION',
  DATA_SUBJECT_REQUEST = 'DATA_SUBJECT_REQUEST',
}

registerEnumType(RetentionEntityType, {
  name: 'RetentionEntityType',
  description: 'The kind of record a retention policy governs',
});
