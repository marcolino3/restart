import { registerEnumType } from '@nestjs/graphql';

export enum ProtocolStatus {
  DRAFT = 'DRAFT',
  FINALIZED = 'FINALIZED',
}

registerEnumType(ProtocolStatus, {
  name: 'ProtocolStatus',
  description: 'Lifecycle status of a meeting protocol',
});
