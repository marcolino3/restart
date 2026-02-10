import { registerEnumType } from '@nestjs/graphql';

export enum AuthProvider {
  PASSWORD = 'PASSWORD',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

registerEnumType(AuthProvider, {
  name: 'AuthProvider',
  description: 'The supported auth providers.',
});
