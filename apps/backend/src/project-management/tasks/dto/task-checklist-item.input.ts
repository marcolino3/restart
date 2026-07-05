import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType()
export class TaskChecklistItemInput {
  // Omitted for a freshly added entry; the server assigns an id then.
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  id?: string | null;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  label: string;

  @Field(() => Boolean)
  @IsBoolean()
  done: boolean;
}
