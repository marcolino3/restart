import { registerEnumType } from '@nestjs/graphql';

/**
 * Lifecycle of a purge candidate. Nothing is ever deleted without passing
 * through APPROVED first (a human review) — the scan only creates PENDING rows.
 */
export enum PurgeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXECUTED = 'EXECUTED',
  FAILED = 'FAILED',
}

registerEnumType(PurgeStatus, {
  name: 'PurgeStatus',
  description: 'Lifecycle of a retention purge candidate',
});
