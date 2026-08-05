import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AbsenceDocument {
  @Field()
  url: string;

  @Field()
  label: string;
}
