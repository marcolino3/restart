import { registerEnumType } from '@nestjs/graphql';

/**
 * Immutable history event recorded whenever a consent decision changes. Kept
 * denormalized (no FK to the mutable consent row) so the trail survives even if
 * the current record is deleted — DSGVO requires consent/withdrawal to be
 * provable after the fact.
 */
export enum ConsentAuditAction {
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  WITHDRAWN = 'WITHDRAWN',
  UPDATED = 'UPDATED',
}

registerEnumType(ConsentAuditAction, {
  name: 'ConsentAuditAction',
  description: 'Immutable history event for a consent decision change',
});
