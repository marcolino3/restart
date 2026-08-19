import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { OrganizationProfileInput } from './organization-profile.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IOrganization } from '../interfaces/organization.interface';

@InputType()
export class UpdateOrganizationInput
  extends PartialType(OrganizationProfileInput)
  implements Partial<IOrganization>
{
  @Field(() => ID)
  @IsString()
  @IsUUID()
  id: string;

  @Field(() => [ID], { nullable: true })
  teamIds?: string[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
