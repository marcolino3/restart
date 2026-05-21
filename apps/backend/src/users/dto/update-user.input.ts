import { Field, ID, InputType } from '@nestjs/graphql';
import { IsDateString, IsOptional, IsUUID, Length } from 'class-validator';

@InputType()
export class UpdateUserInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  firstName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  lastName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Length(3, 60)
  username?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  socialSecurityNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  street?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  houseNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  addressLine2?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  postalCode?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  city?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  country?: string;
}
