import { registerEnumType } from '@nestjs/graphql';

/**
 * Lawful basis for the processing a consent purpose covers (DSGVO Art. 6 /
 * revDSG). For children this is almost always `CONSENT` (given by a guardian).
 */
export enum ConsentLegalBasis {
  CONSENT = 'CONSENT',
  CONTRACT = 'CONTRACT',
  LEGAL_OBLIGATION = 'LEGAL_OBLIGATION',
  VITAL_INTEREST = 'VITAL_INTEREST',
  PUBLIC_TASK = 'PUBLIC_TASK',
  LEGITIMATE_INTEREST = 'LEGITIMATE_INTEREST',
}

registerEnumType(ConsentLegalBasis, {
  name: 'ConsentLegalBasis',
  description: 'Lawful basis for the processing (DSGVO Art. 6 / revDSG)',
});
