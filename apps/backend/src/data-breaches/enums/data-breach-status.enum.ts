import { registerEnumType } from '@nestjs/graphql';

/** Lifecycle of a data-breach incident. CLOSED stamps `closedAt`. */
export enum DataBreachStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  CONTAINED = 'CONTAINED',
  CLOSED = 'CLOSED',
}

registerEnumType(DataBreachStatus, {
  name: 'DataBreachStatus',
  description: 'Lifecycle status of a data-breach incident',
});
