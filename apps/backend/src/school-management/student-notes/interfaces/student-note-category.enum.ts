import { registerEnumType } from '@nestjs/graphql';

export enum StudentNoteCategory {
  GENERAL = 'GENERAL',
  ACADEMIC = 'ACADEMIC',
  BEHAVIOR = 'BEHAVIOR',
  MEETING = 'MEETING',
  HEALTH = 'HEALTH',
  PARENT_CONTACT = 'PARENT_CONTACT',
  OTHER = 'OTHER',
}

registerEnumType(StudentNoteCategory, {
  name: 'StudentNoteCategory',
  description: 'Category of a student note',
});
