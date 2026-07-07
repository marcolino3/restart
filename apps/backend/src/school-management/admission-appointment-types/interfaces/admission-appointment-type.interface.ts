import { IBase } from '@/database/interfaces/base.interface';

export interface IAdmissionAppointmentType extends IBase {
  label: string;
  color?: string | null;
  position: number;
  organizationId: string;
}
