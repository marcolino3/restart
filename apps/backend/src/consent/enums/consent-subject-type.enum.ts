import { registerEnumType } from '@nestjs/graphql';

/**
 * The kind of data subject a consent record refers to. A consent's `subjectId`
 * points at the primary key of the matching table (students / employees).
 * Extend cautiously — every new value needs UI + resolver support.
 */
export enum ConsentSubjectType {
  STUDENT = 'STUDENT',
  EMPLOYEE = 'EMPLOYEE',
}

registerEnumType(ConsentSubjectType, {
  name: 'ConsentSubjectType',
  description: 'The kind of data subject a consent refers to',
});
