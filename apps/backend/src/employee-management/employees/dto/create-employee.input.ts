import {
  IsEmail,
  MaxLength,
  Matches as MatchesBasis,
  IsDateString as IsBasisDate,
} from 'class-validator';
import { Persona } from '@/common/enums/persona.enum';
import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateEmployeeInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  title?: string;

  @Field(() => String)
  @IsString()
  @MaxLength(120)
  @MatchesBasis(/\S/, { message: 'Name must not be blank' })
  firstName: string;

  @Field(() => String)
  @IsString()
  @MaxLength(120)
  @MatchesBasis(/\S/, { message: 'Name must not be blank' })
  lastName: string;

  @Field(() => String)
  @IsString()
  @MaxLength(320)
  @IsEmail()
  email: string;

  @Field(() => Persona)
  @IsEnum(Persona)
  persona!: Persona;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MatchesBasis(/^\d{4}-\d{2}-\d{2}$/)
  @IsBasisDate({ strict: true })
  dateOfBirth?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  socialSecurityNumber?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  contactPhone?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  timeTrackingEnabled?: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  street?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  houseNumber?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  addressLine2?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  city?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  country?: string;
}
