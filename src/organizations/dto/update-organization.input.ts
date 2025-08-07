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

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
