import { registerEnumType } from '@nestjs/graphql';

/**
 * Risk to the affected data subjects. HIGH typically triggers notification of
 * the subjects themselves (DSGVO Art. 34), in addition to the authority (Art. 33).
 */
export enum DataBreachRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

registerEnumType(DataBreachRiskLevel, {
  name: 'DataBreachRiskLevel',
  description: 'Risk to affected data subjects',
});
