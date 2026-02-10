import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateOrganizationInput } from './create-organization.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IOrganization } from '../interfaces/organization.interface';

const EmptyToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));

@InputType()
export class UpdateOrganizationInput
  extends PartialType(CreateOrganizationInput)
  implements Partial<IOrganization>
{
  @Field(() => ID)
  @IsString()
  @IsUUID()
  id: string;

  @Field(() => String, { nullable: false })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  slug?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  domain?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  street?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  zip?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  city?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  country?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @EmptyToUndefined()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  website?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  timezone?: string;

  @Field(() => [ID], { nullable: true })
  teamIds?: string[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
