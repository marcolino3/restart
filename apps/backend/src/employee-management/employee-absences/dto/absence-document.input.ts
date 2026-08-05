import { Field, InputType } from '@nestjs/graphql';
import { IsString, Matches, MaxLength } from 'class-validator';

const ABSENCE_DOC_URL = /^\/api\/absence-certificates\/[a-zA-Z0-9.-]+$/;

@InputType()
export class AbsenceDocumentInput {
  @Field()
  @IsString()
  @Matches(ABSENCE_DOC_URL, {
    message:
      'Document URL must be an uploaded absence certificate (/api/absence-certificates/…)',
  })
  url: string;

  @Field()
  @IsString()
  @MaxLength(200)
  label: string;
}
