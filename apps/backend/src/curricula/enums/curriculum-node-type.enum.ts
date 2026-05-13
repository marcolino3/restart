import { registerEnumType } from '@nestjs/graphql';

export enum CurriculumNodeType {
  AREA = 'AREA',
  TOPIC = 'TOPIC',
  PRESENTATION = 'PRESENTATION',
  WORK = 'WORK',
}

registerEnumType(CurriculumNodeType, {
  name: 'CurriculumNodeType',
  description:
    'Hierarchy level of a curriculum node: AREA > TOPIC > PRESENTATION > WORK',
});
