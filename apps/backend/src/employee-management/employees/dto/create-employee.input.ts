import { Persona } from '@/common/enums/persona.enum';
import { InputType, Field } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class CreateEmployeeInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  title?: string;

  @Field(() => String)
  @IsString()
  firstName: string;

  @Field(() => String)
  @IsString()
  lastName: string;

  @Field(() => String)
  @IsString()
  email: string;

  @Field(() => Persona)
  @IsEnum(Persona)
  persona!: Persona;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  socialSecurityNumber?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  timeTrackingEnabled?: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  street?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  houseNumber?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  city?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  country?: string;
}
