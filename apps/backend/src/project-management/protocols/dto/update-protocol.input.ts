import { Field, ID, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateProtocolInput } from './create-protocol.input';

@InputType()
export class UpdateProtocolInput extends PartialType(
  // Eine Vorlage wird nur beim Erstellen angewendet, nie nachträglich.
  OmitType(CreateProtocolInput, ['templateId'] as const),
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
