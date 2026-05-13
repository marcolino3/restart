import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { AuthProvider } from '../interfaces/auth-provider.enum';

@InputType()
export class CreateAuthAccountInput {
  @Field(() => ID)
  @IsUUID()
  userEmailId!: string;

  @Field(() => AuthProvider)
  @IsEnum(AuthProvider)
  provider!: AuthProvider;

  @Field(() => String)
  @IsNotEmpty()
  providerId!: string;
}
