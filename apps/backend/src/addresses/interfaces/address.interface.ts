import { IBase } from '@/database/interfaces/base.interface';
import { Country } from '@/countries/entities/country.entity';
export interface IAddress extends IBase {
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  country?: Country;
}
