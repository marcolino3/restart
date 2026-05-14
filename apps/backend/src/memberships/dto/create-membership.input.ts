import { Persona } from '@/common/enums/persona.enum';
import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class CreateMembershipInput {
  @Field(() => ID)
  @IsUUID()
  userId!: string;

  @Field(() => ID)
  @IsUUID()
  organizationId!: string;

  @Field(() => Persona)
  @IsEnum(Persona)
  persona!: Persona;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  userEmailId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(30)
  contactPhone?: string;
}
