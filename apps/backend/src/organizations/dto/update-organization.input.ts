import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateOrganizationInput } from './create-organization.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IOrganization } from '../interfaces/organization.interface';

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
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  slug?: string;

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
