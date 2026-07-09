import { Field, ID, Int, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { RelationshipType } from '../enums/relationship-type.enum';
import { Salutation } from '../enums/salutation.enum';
import { LinkContactPersonInput } from './link-contact-person.input';

@InputType()
export class CreateContactPersonInput {
  @Field(() => Salutation, { nullable: true })
  @IsOptional()
  @IsEnum(Salutation)
  salutation?: Salutation;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  title?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  middleName?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lastName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  mobile?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  socialSecurityNumber?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  nationalities?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  preferredLanguages?: string[];

  @Field(() => [RelationshipType], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(RelationshipType, { each: true })
  roles?: RelationshipType[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  occupation?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  /** Family this contact belongs to (validated against the active org). */
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  familyId?: string;

  /** Ordering within the family; lowest = primary contact. */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @Field(() => [LinkContactPersonInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkContactPersonInput)
  links?: LinkContactPersonInput[];
}
