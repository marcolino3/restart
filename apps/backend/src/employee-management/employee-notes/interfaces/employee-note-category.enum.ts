import { registerEnumType } from '@nestjs/graphql';

export enum EmployeeNoteCategory {
  GENERAL = 'GENERAL',
  WARNING = 'WARNING',
  MEETING = 'MEETING',
  CONTRACT = 'CONTRACT',
  REQUEST = 'REQUEST',
  PERFORMANCE = 'PERFORMANCE',
  OTHER = 'OTHER',
}

registerEnumType(EmployeeNoteCategory, {
  name: 'EmployeeNoteCategory',
  description: 'Category of an employee note',
});
