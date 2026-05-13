import { IBase } from '@/database/interfaces/base.interface';
import { RelationshipType } from '../enums/relationship-type.enum';

export interface IStudentContactPerson extends IBase {
  studentId: string;
  contactPersonId: string;
  relationshipType: RelationshipType;
  isPrimaryContact: boolean;
  hasCustody: boolean;
  isPickupAuthorized: boolean;
  emergencyPriority?: number | null;
  livesWithStudent: boolean;
  notes?: string | null;
  organizationId: string;
}
