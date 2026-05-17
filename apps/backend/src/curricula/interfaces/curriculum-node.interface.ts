import { IBase } from '@/database/interfaces/base.interface';
import { CurriculumNodeType } from '../enums/curriculum-node-type.enum';
import { LessonScale } from '../enums/lesson-scale.enum';
import { LessonType } from '../enums/lesson-type.enum';

export interface ICurriculumNode extends IBase {
  curriculumId: string;
  levelId: string;
  parentId?: string | null;
  nodeType: CurriculumNodeType;
  position: number;
  lessonType?: LessonType | null;
  lessonScale?: LessonScale | null;
  organizationId: string;
}
