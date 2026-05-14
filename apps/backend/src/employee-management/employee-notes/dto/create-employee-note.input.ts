import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EmployeeNoteCategory } from '../interfaces/employee-note-category.enum';

@InputType()
export class CreateEmployeeNoteInput {
  @Field(() => ID)
  @IsUUID()
  employeeId: string;

  @Field(() => EmployeeNoteCategory)
  @IsEnum(EmployeeNoteCategory)
  category: EmployeeNoteCategory;

  @Field(() => String)
  @IsString()
  @MaxLength(200)
  title: string;

  @Field(() => String)
  @IsString()
  content: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isConfidential?: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  date?: string;
}
