import { registerEnumType } from '@nestjs/graphql';

export enum CurriculumNodeType {
  AREA = 'AREA',
  TOPIC = 'TOPIC',
  GROUP = 'GROUP',
  LESSON = 'LESSON',
}

registerEnumType(CurriculumNodeType, {
  name: 'CurriculumNodeType',
  description:
    'Hierarchy level of a curriculum node: AREA > TOPIC > GROUP > LESSON',
});
