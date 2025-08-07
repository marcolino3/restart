import { registerEnumType } from '@nestjs/graphql';

export enum RestartModule {
  EMPLOYEES = 'EMPLOYEES',
  RECORD_KEEPING = 'RECORD_KEEPING',
}

registerEnumType(RestartModule, {
  name: 'RestartModule',
  description: 'Supported Restart Modules',
});
