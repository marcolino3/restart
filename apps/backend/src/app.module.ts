import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';
import { LoggerModule } from 'nestjs-pino';
import { DataSource, EntityManager } from 'typeorm';
import { loggerConfig } from './logger.config';
import { resolveSynchronize } from './database/resolve-synchronize';
import { createMaxDepthRule } from './common/graphql/max-depth.validation-rule';
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
import { ProjectManagementModule } from './project-management/project-management.module';
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
import { ContractDocumentsModule } from './employee-management/contract-documents/contract-documents.module';
import { StorageModule } from './storage/storage.module';

// Upper bound on GraphQL query nesting. The deepest legitimate queries in the
// app (curriculum/team ancestor traversal, admission board with nested cards)
// sit well under this; it exists to reject abusive deeply-nested queries.
const MAX_QUERY_DEPTH = 12;

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
    // Zeitgesteuerte Jobs (nächtlicher Ledger-Reconcile der Zeiterfassung).
    ScheduleModule.forRoot(),

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

        // synchronize fail-closed: in production/staging hart gesperrt, eine
        // Fehlkonfig (DB_SYNCHRONIZE=true) bricht den Boot ab. Siehe
        // resolve-synchronize.ts (+ Tests).
        const synchronize = resolveSynchronize(
          nodeEnv,
          configService.get<string>('DB_SYNCHRONIZE'),
        );

        return {
          type: 'postgres',
          host: configService.getOrThrow('DB_HOST'),
          port: configService.getOrThrow('DB_PORT'),
          username: configService.getOrThrow('DB_USERNAME'),
          password: configService.getOrThrow('DB_PASSWORD'),
          database: configService.getOrThrow('DB_NAME'),
          autoLoadEntities: true,
          synchronize,
          ssl: isProd ? { rejectUnauthorized: false } : false,
          autoSchemaFile: true,
          migrationsRun,
          migrations: [__dirname + '/migrations/*.{ts,js}'],
          migrationsTableName: 'typeorm_migrations',
          // 'each' statt Default 'all': siehe data-source.ts — PG16 lehnt die
          // Nutzung frisch ergänzter Enum-Werte in derselben Transaktion ab
          // (55P04); der Boot-Migrationslauf auf frischer DB bricht sonst ab.
          migrationsTransactionMode: 'each',
        };
      },
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      inject: [DataSource, ConfigService],
      driver: ApolloDriver,
      useFactory: (dataSource: DataSource, configService: ConfigService) => {
        const isProd = configService.get<string>('NODE_ENV') === 'production';
        return {
          autoSchemaFile: true,
          // Introspection and the Apollo sandbox landing page leak the full
          // schema and an interactive query console — dev-only.
          introspection: !isProd,
          playground: false,
          validationRules: [createMaxDepthRule(MAX_QUERY_DEPTH)],
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
          plugins: isProd ? [] : [ApolloServerPluginLandingPageLocalDefault()],
        };
      },
    }),

    // Public uploaded assets (avatars, org logos) are proxied from object
    // storage by StorageModule's PublicAssetController under /api/uploads —
    // same URL scheme as before, now backed by S3 (Infomaniak) in production
    // with a local filesystem fallback for dev/CI. Contract PDFs use the
    // authenticated ContractDocumentsController (never public).
    StorageModule,
    UploadModule,
    ContractDocumentsModule,
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
    ProjectManagementModule,
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
