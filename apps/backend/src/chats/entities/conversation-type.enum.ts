import { registerEnumType } from '@nestjs/graphql';

/**
 * Kind of a chat conversation.
 *
 * - DIRECT: 1:1 conversation between exactly two org members.
 * - GROUP: freely named group with an arbitrary set of members.
 * - TEAM: conversation bound to a Team (see employee-management/teams).
 *   Membership mirrors the team's effective members; the team hierarchy
 *   (TeamAccessService) governs who may participate.
 */
export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  TEAM = 'TEAM',
}

registerEnumType(ConversationType, {
  name: 'ConversationType',
  description: 'Kind of a chat conversation (DIRECT, GROUP or TEAM)',
});
