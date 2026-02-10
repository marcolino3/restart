import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OrganizationSettingOutput {
  @Field(() => ID)
  id: string;

  @Field()
  organizationId: string;

  @Field()
  key: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field()
  hasValue: boolean;

  @Field(() => String, { nullable: true })
  value?: string;

  @Field(() => Int)
  version: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
