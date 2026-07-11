import { registerEnumType } from '@nestjs/graphql';

/**
 * Role a membership holds within a single conversation.
 *
 * - MEMBER: ordinary participant. May read and post messages.
 * - ADMIN: may additionally rename the conversation, add/remove members
 *   and delete it. The creator of a GROUP conversation becomes ADMIN.
 *
 * DIRECT and TEAM conversations do not expose admin actions in the UI;
 * every participant is effectively a MEMBER there.
 */
export enum ParticipantRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}

registerEnumType(ParticipantRole, {
  name: 'ParticipantRole',
  description: 'Role of a membership within a conversation (MEMBER or ADMIN)',
});
