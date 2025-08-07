import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { OrganizationsModule } from './organizations/organizations.module';
import { CommonModule } from './common/common.module';
import { AddressesModule } from './addresses/addresses.module';
import { CountriesModule } from './countries/countries.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AuthAccountsModule } from './auth-accounts/auth-accounts.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { EmployeeContractsModule } from './employee-management/employee-contracts/employee-contracts.module';
import { EmployeeManagementModule } from './employee-management/employee-management.module';

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
        synchronize: true,
        autoSchemaFile: true,
        // schema: 'public',
        migrationsRun: true,
        migrations: ['/migrations/*.ts'],
        // logging: true,
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      autoSchemaFile: true, // Falls du ein Schema generierst
      introspection: true,
      // autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    console.log('state', process.env.STATE);
    console.log('host', process.env.DB_HOST);
    console.log('port', process.env.DB_PORT);
    console.log('username', process.env.DB_USERNAME);
    console.log('password', process.env.DB_PASSWORD);
    console.log('db name', process.env.DB_NAME);
  }
}
