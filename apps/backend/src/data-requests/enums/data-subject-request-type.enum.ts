import { registerEnumType } from '@nestjs/graphql';

/**
 * The data-subject right being exercised (DSGVO Art. 15–21 / revDSG).
 */
export enum DataSubjectRequestType {
  ACCESS = 'ACCESS',
  RECTIFICATION = 'RECTIFICATION',
  ERASURE = 'ERASURE',
  PORTABILITY = 'PORTABILITY',
  OBJECTION = 'OBJECTION',
  RESTRICTION = 'RESTRICTION',
}

registerEnumType(DataSubjectRequestType, {
  name: 'DataSubjectRequestType',
  description: 'The data-subject right being exercised (DSGVO Art. 15–21)',
});
