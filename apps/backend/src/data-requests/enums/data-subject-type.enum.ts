import { registerEnumType } from '@nestjs/graphql';

/**
 * What kind of person the request concerns. `OTHER` covers requesters who are
 * not (yet) a record in the system — the human name is always captured too.
 */
export enum DataSubjectType {
  STUDENT = 'STUDENT',
  EMPLOYEE = 'EMPLOYEE',
  CONTACT_PERSON = 'CONTACT_PERSON',
  OTHER = 'OTHER',
}

registerEnumType(DataSubjectType, {
  name: 'DataSubjectType',
  description: 'The kind of person a data-subject request concerns',
});
