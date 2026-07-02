import { Field, ID, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateProjectInput } from './create-project.input';

@InputType()
export class UpdateProjectInput extends PartialType(
  // Member list is managed via the dedicated project-member mutations, not here.
  OmitType(CreateProjectInput, ['memberMembershipIds'] as const),
) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
