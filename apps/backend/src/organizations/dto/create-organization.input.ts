import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

const EmptyToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));

@InputType()
export class CreateOrganizationInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  organizationName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  organizationSlug?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  ownerFirstName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  ownerLastName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @EmptyToUndefined()
  ownerEmail?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MinLength(8)
  @EmptyToUndefined()
  ownerPassword?: string;

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
}
