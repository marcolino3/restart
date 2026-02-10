import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class CreateOrganizationSettingInput {
  @Field(() => ID)
  @IsUUID()
  organizationId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  key: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  value: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
