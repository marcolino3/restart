import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

@InputType()
export class CreateOrganizationInput {
  @Field(() => String)
  @IsNotEmpty()
  organizationName: string;

  @Field(() => String)
  @IsNotEmpty()
  organizationSlug: string;

  @Field(() => String)
  @IsNotEmpty()
  ownerFirstName: string;

  @Field(() => String)
  @IsNotEmpty()
  ownerLastName: string;

  @Field(() => String)
  @IsEmail()
  ownerEmail: string;

  @Field(() => String)
  @MinLength(8)
  ownerPassword: string;
}
