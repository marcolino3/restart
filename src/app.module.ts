import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { AddressesModule } from './addresses/addresses.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthAccountsModule } from './auth-accounts/auth-accounts.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { CountriesModule } from './countries/countries.module';
import { EmployeeContractsModule } from './employee-management/employee-contracts/employee-contracts.module';
import { EmployeeManagementModule } from './employee-management/employee-management.module';
import { MembershipsModule } from './memberships/memberships.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { GoogleModule } from './google/google.module';
import { OrganizationSettingsModule } from './organization-settings/organization-settings.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow('DB_HOST'),

        port: configService.getOrThrow('DB_PORT'),
        username: configService.getOrThrow('DB_USERNAME'),
        password: configService.getOrThrow('DB_PASSWORD'),
        database: configService.getOrThrow('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
        ssl:
          configService.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        autoSchemaFile: true,
        migrationsRun: true,
        migrations: ['/migrations/*.ts'],
      }),
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      inject: [DataSource],
      driver: ApolloDriver,
      useFactory: (dataSource: DataSource) => ({
        autoSchemaFile: true,
        introspection: true,
        playground: false,
        context: ({
          req,
          res,
        }: {
          req: Request;
          res: Response;
          entityManager: EntityManager;
        }) => ({
          req,
          res,
          entityManager: dataSource.manager, // 💡 wichtig für deine Decorators
        }),
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
      }),
    }),

    OrganizationsModule,
    CommonModule,
    AddressesModule,
    CountriesModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuthAccountsModule,
    AuthModule,
    EmployeeContractsModule,
    EmployeeManagementModule,
    MembershipsModule,
    MailModule,
    GoogleModule,
    OrganizationSettingsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
