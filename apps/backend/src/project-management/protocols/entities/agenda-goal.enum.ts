import { registerEnumType } from '@nestjs/graphql';

export enum AgendaGoal {
  DECISION = 'DECISION',
  INFORMATION = 'INFORMATION',
  DISCUSSION = 'DISCUSSION',
}

registerEnumType(AgendaGoal, {
  name: 'AgendaGoal',
  description:
    'Purpose of an agenda item (Entscheidung / Information / Diskussion)',
});
