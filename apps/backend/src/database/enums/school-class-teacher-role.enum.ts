import { registerEnumType } from '@nestjs/graphql';

export enum SchoolClassTeacherRole {
  LEAD = 'LEAD',
  ASSISTANT = 'ASSISTANT',
}

registerEnumType(SchoolClassTeacherRole, {
  name: 'SchoolClassTeacherRole',
  description:
    'Role of a teacher within a class. Several LEAD teachers per class are allowed — co-teaching and job sharing are the normal case.',
});
