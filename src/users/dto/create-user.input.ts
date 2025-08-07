import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString } from 'class-validator';
import { IUser } from '../interfaces/user.interface';

@InputType()
export class CreateUserInput implements Partial<IUser> {
  @Field(() => String)
  @IsString()
  firstName?: string;

  @Field(() => String)
  @IsString()
  lastName?: string;

  @Field(() => String)
  @IsString()
  @IsEmail()
  email: string;

  @Field(() => String)
  @IsString()
  password: string;
}
