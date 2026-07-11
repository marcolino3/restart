import { IBase } from '@/database/interfaces/base.interface';

export interface IStudentRecordCategory extends IBase {
  name: string;
  color?: string | null;
  position: number;
  organizationId: string;
}
