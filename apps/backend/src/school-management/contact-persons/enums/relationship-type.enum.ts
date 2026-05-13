import { registerEnumType } from '@nestjs/graphql';

export enum RelationshipType {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  STEP_FATHER = 'STEP_FATHER',
  STEP_MOTHER = 'STEP_MOTHER',
  GRANDFATHER = 'GRANDFATHER',
  GRANDMOTHER = 'GRANDMOTHER',
  SIBLING = 'SIBLING',
  NANNY = 'NANNY',
  LEGAL_GUARDIAN = 'LEGAL_GUARDIAN',
  AUNT_UNCLE = 'AUNT_UNCLE',
  OTHER = 'OTHER',
}

registerEnumType(RelationshipType, {
  name: 'RelationshipType',
  description:
    'Relationship of a contact person to a student (parent, guardian, sibling, etc.)',
});
