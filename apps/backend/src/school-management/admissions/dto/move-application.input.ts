import { Field, ID, Int, InputType } from '@nestjs/graphql';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

@InputType()
export class MoveAdmissionApplicationInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => ID)
  @IsUUID()
  toStageId: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
