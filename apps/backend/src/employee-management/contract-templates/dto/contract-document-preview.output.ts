import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ContractDocumentPreview {
  @Field(() => String)
  bodyHtml: string;

  @Field(() => String, { nullable: true })
  headerHtml?: string | null;

  @Field(() => String, { nullable: true })
  footerHtml?: string | null;

  @Field(() => Boolean)
  showLogo: boolean;
}
