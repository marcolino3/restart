import { registerEnumType } from '@nestjs/graphql';

export enum Salutation {
  MR = 'MR',
  MRS = 'MRS',
  DIVERSE = 'DIVERSE',
  NONE = 'NONE',
}

registerEnumType(Salutation, {
  name: 'Salutation',
  description: 'Form of address for a contact person',
});
