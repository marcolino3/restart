import { IBase } from '@/database/interfaces/base.interface';

export interface IFamily extends IBase {
  name?: string | null;
  primaryAddressId?: string | null;
  notes?: string | null;
  organizationId: string;
}
