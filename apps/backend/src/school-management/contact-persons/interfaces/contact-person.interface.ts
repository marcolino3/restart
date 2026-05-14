import { IBase } from '@/database/interfaces/base.interface';
import { RelationshipType } from '../enums/relationship-type.enum';
import { Salutation } from '../enums/salutation.enum';

export interface IContactPerson extends IBase {
  salutation?: Salutation | null;
  title?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  dateOfBirth?: string | null;
  socialSecurityNumber?: string | null;
  nationalities: string[];
  preferredLanguages: string[];
  roles: RelationshipType[];
  occupation?: string | null;
  notes?: string | null;
  addressId?: string | null;
  userId?: string | null;
  organizationId: string;
}
