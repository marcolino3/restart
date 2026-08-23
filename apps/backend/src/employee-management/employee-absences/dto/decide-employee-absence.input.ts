import { Field, ID, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class DecideEmployeeAbsenceInput {
  @Field(() => ID)
  @IsUUID('4')
  id: string;

  // Optional bei Genehmigung, Pflicht bei Ablehnung (Service prueft).
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string | null;
}
