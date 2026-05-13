import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthIntegrationModule } from '@thallesp/nestjs-better-auth';
import { auth } from '@/lib/auth';

@Module({
  imports: [
    BetterAuthIntegrationModule.forRoot({
      auth,
      // We have our own GraphQLAccessGuard + @Permissions() RBAC system on the
      // existing REST controllers, so we do NOT want a global auth guard
      // protecting every route during the POC. Routes opt in via @Session()
      // and the existing guards.
      disableGlobalAuthGuard: true,
    }),
  ],
})
export class BetterAuthModule {}
