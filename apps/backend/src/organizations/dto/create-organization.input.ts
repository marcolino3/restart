import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform, type TransformFnParams } from 'class-transformer';
import { OrganizationProfileInput } from './organization-profile.input';

// class-transformer types `TransformFnParams.value` as `any`; the inputs
// here are always plain form/GraphQL string values.
const EmptyToUndefined = () =>
  Transform(({ value }: TransformFnParams): unknown =>
    value === '' ? undefined : (value as unknown),
  );

@InputType()
export class CreateOrganizationInput extends OrganizationProfileInput {
  /** @deprecated Use `name`. Kept for the seed scripts. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  organizationName?: string;

  /** @deprecated Use `subdomain`. Kept for the seed scripts. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  organizationSubdomain?: string;

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
}
