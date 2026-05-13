import { IBase } from '@/database/interfaces/base.interface';

export interface ICurriculum extends IBase {
  slug: string;
  position: number;
  organizationId: string;
}
