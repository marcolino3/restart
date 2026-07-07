import { IBase } from '@/database/interfaces/base.interface';

export interface IAdmissionSource extends IBase {
  name: string;
  color?: string | null;
  position: number;
  systemKey?: string | null;
  organizationId: string;
}
