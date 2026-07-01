import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AgendaGoal } from './agenda-goal.enum';

@ObjectType()
export class AgendaItem {
  @Field(() => Int, { nullable: true })
  no?: number | null;

  @Field(() => String)
  topic: string;

  @Field(() => AgendaGoal, { nullable: true })
  goal?: AgendaGoal | null;
}

@ObjectType()
export class ProtocolDecision {
  @Field(() => String)
  topic: string;

  @Field(() => String, { nullable: true })
  decision?: string | null;

  @Field(() => String, { nullable: true })
  responsible?: string | null;

  @Field(() => String, { nullable: true })
  dueDate?: string | null;
}

@ObjectType()
export class ProtocolCommunication {
  @Field(() => String)
  topic: string;

  @Field(() => String, { nullable: true })
  audience?: string | null;

  @Field(() => String, { nullable: true })
  responsible?: string | null;

  @Field(() => String, { nullable: true })
  channel?: string | null;

  @Field(() => String, { nullable: true })
  dueDate?: string | null;
}

@ObjectType()
export class ProtocolChallenge {
  @Field(() => String)
  topic: string;

  @Field(() => String, { nullable: true })
  challenge?: string | null;

  @Field(() => String, { nullable: true })
  supportNeeded?: string | null;
}

@ObjectType()
export class ProtocolOpenPoint {
  @Field(() => String)
  topic: string;

  @Field(() => String, { nullable: true })
  nextStep?: string | null;

  @Field(() => Boolean)
  forNextMeeting: boolean;
}

@ObjectType()
export class ProtocolSections {
  @Field(() => [AgendaItem])
  agendaItems: AgendaItem[];

  @Field(() => [ProtocolDecision])
  decisions: ProtocolDecision[];

  @Field(() => [ProtocolCommunication])
  communications: ProtocolCommunication[];

  @Field(() => [String])
  infoPoints: string[];

  @Field(() => [ProtocolChallenge])
  challenges: ProtocolChallenge[];

  @Field(() => [ProtocolOpenPoint])
  openPoints: ProtocolOpenPoint[];
}

export const EMPTY_SECTIONS: ProtocolSections = {
  agendaItems: [],
  decisions: [],
  communications: [],
  infoPoints: [],
  challenges: [],
  openPoints: [],
};
