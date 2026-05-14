import { InputType, Field, ID } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class CreateAddressInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  houseNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  postalCode?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  state?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  countryId?: string;
}
