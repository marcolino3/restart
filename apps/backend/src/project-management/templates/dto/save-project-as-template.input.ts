import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType()
export class SaveProjectAsTemplateInput {
  @Field(() => ID)
  @IsUUID()
  projectId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;
}
