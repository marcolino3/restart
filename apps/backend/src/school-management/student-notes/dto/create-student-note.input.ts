import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { StudentNoteCategory } from '../interfaces/student-note-category.enum';

@InputType()
export class CreateStudentNoteInput {
  @Field(() => ID)
  @IsUUID()
  studentId: string;

  @Field(() => StudentNoteCategory)
  @IsEnum(StudentNoteCategory)
  category: StudentNoteCategory;

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
