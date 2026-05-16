import { IBase } from '@/database/interfaces/base.interface';

export interface ICurriculumLevel extends IBase {
  slug: string;
  position: number;
  curriculumId: string;
  organizationId: string;
}
