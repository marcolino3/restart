import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdateRolePermissionsInput {
  @Field(() => ID)
  roleId: string;

  @Field(() => [String])
  permissionCodes: string[];
}
