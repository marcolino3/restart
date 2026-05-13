import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Gender } from '@/database/enums/gender.enum';

@InputType()
export class CreateStudentInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @Field(() => Gender, { nullable: true })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  enrollmentDate?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  exitDate?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  admissionStageId?: string;
}
