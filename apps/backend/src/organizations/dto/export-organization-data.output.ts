import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ExportOrganizationDataResult {
  @Field(() => ID)
  jobId: string;

  @Field()
  status: string;
}
