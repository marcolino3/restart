import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';
import { LoggerModule } from 'nestjs-pino';
import { DataSource, EntityManager } from 'typeorm';
import { loggerConfig } from './logger.config';
import { AddressesModule } from './addresses/addresses.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthAccountsModule } from './auth-accounts/auth-accounts.module';
import { AuthModule } from './auth/auth.module';
import { BetterAuthModule } from './better-auth/better-auth.module';
import { UserEmailsModule } from './user-emails/user-emails.module';
import { CommonModule } from './common/common.module';
import { CountriesModule } from './countries/countries.module';
import { CountryInputTemplatesModule } from './country-input-templates/country-input-templates.module';
import { EmployeeContractsModule } from './employee-management/employee-contracts/employee-contracts.module';
import { EmployeeManagementModule } from './employee-management/employee-management.module';
import { SchoolManagementModule } from './school-management/school-management.module';
import { CurriculaModule } from './curricula/curricula.module';
import { CurriculumNodeLoaders } from './curricula/loaders/curriculum-node-loaders';
import { StudentEnrollmentLoaders } from './school-management/students/loaders/student-enrollment-loaders';
import { MembershipsModule } from './memberships/memberships.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { GoogleModule } from './google/google.module';
import { OrganizationSettingsModule } from './organization-settings/organization-settings.module';
import { HealthModule } from './health/health.module';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Globales Rate-Limit als Defense-in-Depth (Ingress hat eigenes Limit).
    // Drei Buckets: short (Burst-Schutz), medium (Normal), long (sustained).
    // Login/Register/Reset bekommen via @Throttle()-Decorator strengere Limits
    // direkt am Controller (siehe SPEC für TODO im Auth-Modul).
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10_000, limit: 50 },
      { name: 'long', ttl: 60_000, limit: 200 },
    ]),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV');
        const isProd = nodeEnv === 'production';
        // In Production werden Migrationen über einen separaten K8s Pre-Deploy-Job
        // ausgeführt (siehe k8s/base/jobs/migrate-job.yaml), damit ein fehlgeschlagenes
        // Schema-Update den Rollout blockiert. In Dev/Staging laufen sie beim Boot.
        const migrationsRun =
          configService.get<string>('DB_MIGRATIONS_RUN') === 'true' ||
          (!isProd &&
            configService.get<string>('DB_MIGRATIONS_RUN') !== 'false');

        return {
          type: 'postgres',
          host: configService.getOrThrow('DB_HOST'),
          port: configService.getOrThrow('DB_PORT'),
          username: configService.getOrThrow('DB_USERNAME'),
          password: configService.getOrThrow('DB_PASSWORD'),
          database: configService.getOrThrow('DB_NAME'),
          autoLoadEntities: true,
          synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
          ssl: isProd ? { rejectUnauthorized: false } : false,
          autoSchemaFile: true,
          migrationsRun,
          migrations: [__dirname + '/migrations/*.{ts,js}'],
          migrationsTableName: 'typeorm_migrations',
        };
      },
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
          loaders: {
            curriculumNodes: new CurriculumNodeLoaders(dataSource),
            studentEnrollments: new StudentEnrollmentLoaders(dataSource),
          },
        }),
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
      }),
    }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/public',
    }),
    UploadModule,
    OrganizationsModule,
    CommonModule,
    AddressesModule,
    CountriesModule,
    CountryInputTemplatesModule,
    UsersModule,
    UserEmailsModule,
    RolesModule,
    PermissionsModule,
    AuthAccountsModule,
    AuthModule,
    BetterAuthModule,
    EmployeeContractsModule,
    EmployeeManagementModule,
    SchoolManagementModule,
    CurriculaModule,
    MembershipsModule,
    MailModule,
    GoogleModule,
    OrganizationSettingsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    // ThrottlerGuard global registrieren — kann pro Route/Controller mit
    // @SkipThrottle() ausgenommen oder mit @Throttle() überschrieben werden.
    // GqlThrottlerGuard ist eine Sub-Klasse, die zusätzlich GraphQL-Requests
    // korrekt aus dem GqlExecutionContext liest (sonst crasht getTracker auf
    // `req.ip`).
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
    AppService,
  ],
})
export class AppModule {}
