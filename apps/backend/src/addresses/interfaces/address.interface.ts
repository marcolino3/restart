import { IBase } from '@/database/interfaces/base.interface';
import { Country } from '@/countries/entities/country.entity';

export interface IAddress extends IBase {
  street?: string;
  houseNumber?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: Country;
  organizationId: string;
}
