import { Persona } from '@/common/enums/persona.enum';
import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsString } from 'class-validator';

@InputType()
export class CreateEmployeeInput {
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
}
