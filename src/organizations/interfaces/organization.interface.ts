import { IBase } from '@/database/interfaces/base.interface';
import { IAddress } from '@/addresses/interfaces/address.interface';
import { Country } from '@/countries/entities/country.entity';
import { CreateAddressInput } from '@/addresses/dto/create-address.input';
import { Team } from '@/employee-management/teams/entities/team.entity';

export interface IOrganization extends IBase {
  name?: string;
  subDomain?: string;
  addressId?: string;
  address?: IAddress | CreateAddressInput;
  parentOrganzationId?: string;
  parentOrganization?: IOrganization;
  teamIds?: string[];
  teams?: Team[];
  countryId?: string;
  country?: Country;
}
