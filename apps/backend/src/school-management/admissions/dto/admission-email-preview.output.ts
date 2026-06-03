import { Field, ObjectType } from '@nestjs/graphql';

/**
 * Result of resolving a template against an application: placeholders are
 * already substituted, ready to prefill the send editor. The user reviews and
 * edits before sending.
 */
@ObjectType()
export class AdmissionEmailPreview {
  @Field(() => String)
  subject: string;

  @Field(() => String)
  bodyHtml: string;

  @Field(() => String, { nullable: true })
  toEmail?: string | null;

  @Field(() => String, { nullable: true })
  toName?: string | null;

  @Field(() => [String])
  availableVariables: string[];
}
