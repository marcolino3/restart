import { registerEnumType } from '@nestjs/graphql';

/**
 * LK-Selbstbeobachtung: Stimmung im Raum während der Lektion.
 */
export enum RoomMood {
  CALM = 'CALM',
  FOCUSED = 'FOCUSED',
  RESTLESS = 'RESTLESS',
  DIFFICULT = 'DIFFICULT',
}

registerEnumType(RoomMood, {
  name: 'RoomMood',
  description: 'Stimmung im Raum: CALM / FOCUSED / RESTLESS / DIFFICULT.',
});
