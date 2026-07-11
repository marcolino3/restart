import { IBase } from '@/database/interfaces/base.interface';
import { IOrganization } from '@/organizations/interfaces/organization.interface';
import { Gender } from '@/database/enums/gender.enum';

export interface IStudent extends IBase {
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  enrollmentDate?: string | null;
  exitDate?: string | null;
  notes?: string | null;
  preferredName?: string | null;
  placeOfBirth?: string | null;
  firstLanguages?: string[] | null;
  familyLanguages?: string[] | null;
  religion?: string | null;
  socialSecurityNumber?: string | null;
  externalStudentId?: string | null;
  admissionStageId?: string | null;
  organizationId: string;
  organization?: IOrganization | null;
}
