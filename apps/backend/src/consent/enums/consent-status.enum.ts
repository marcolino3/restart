import { registerEnumType } from '@nestjs/graphql';

/**
 * Current decision on a consent purpose for a subject. `WITHDRAWN` is a
 * previously granted consent that was later revoked — it is distinct from
 * `DENIED` (never granted) because withdrawal must be provable for DSGVO.
 */
export enum ConsentStatus {
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  WITHDRAWN = 'WITHDRAWN',
}

registerEnumType(ConsentStatus, {
  name: 'ConsentStatus',
  description: 'Current decision on a consent purpose for a subject',
});
