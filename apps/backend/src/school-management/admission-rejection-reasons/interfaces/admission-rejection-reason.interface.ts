import { IBase } from '@/database/interfaces/base.interface';

export interface IAdmissionRejectionReason extends IBase {
  label: string;
  color?: string | null;
  position: number;
  organizationId: string;
}
