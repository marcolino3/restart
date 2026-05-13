import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthIntegrationModule } from '@thallesp/nestjs-better-auth';
import { auth } from '@/lib/auth';
import { UsersModule } from '@/users/users.module';
import { DatabaseModule } from '@/database/database.module';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { BetterAuthPocResolver } from './better-auth-poc.resolver';

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
    DatabaseModule,
    UsersModule,
  ],
  providers: [GqlBetterAuthGuard, BetterAuthPocResolver],
  exports: [GqlBetterAuthGuard],
})
export class BetterAuthModule {}
