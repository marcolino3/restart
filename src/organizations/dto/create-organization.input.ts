import { InputType, Field } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { IOrganization } from '@/organizations/interfaces/organization.interface';
import { CreateAddressInput } from '@/addresses/dto/create-address.input';
import { Type } from 'class-transformer';

@InputType()
export class CreateOrganizationInput implements Partial<IOrganization> {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  subDomain?: string;

  @Field(() => CreateAddressInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressInput)
  address?: CreateAddressInput;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsUUID('4')
  parentOrganzationId?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  teamIds?: string[];

  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  isActive?: boolean;
}
