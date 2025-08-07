import { IBase } from '@/database/interfaces/base.interface';
export interface ICountry extends IBase {
  name: string;
  isoCode: string;
  currency: string;
}
