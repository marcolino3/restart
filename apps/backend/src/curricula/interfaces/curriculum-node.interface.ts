import { IBase } from '@/database/interfaces/base.interface';
import { CurriculumNodeType } from '../enums/curriculum-node-type.enum';

export interface ICurriculumNode extends IBase {
  curriculumId: string;
  levelId: string;
  parentId?: string | null;
  nodeType: CurriculumNodeType;
  position: number;
  organizationId: string;
}
