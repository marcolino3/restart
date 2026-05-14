import { IBase } from '@/database/interfaces/base.interface';
import { AdmissionStageType } from '../enums/admission-stage-type.enum';

export interface IAdmissionStage extends IBase {
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  position: number;
  stageType: AdmissionStageType;
  isDefault: boolean;
  organizationId: string;
}
