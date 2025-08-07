import { Address } from '@/addresses/entities/address.entity';
import { AuthAccount } from '@/auth-accounts/entities/auth-account.entity';
import { Country } from '@/countries/entities/country.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { TeamMembership } from '@/employee-management/teams/entities/team-membership.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Permission } from '@/permissions/entities/permission.entity';
import { Role } from '@/roles/entities/role.entity';
import { User } from '@/users/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      Role,
      Address,
      Country,
      Team,
      TeamMembership,
      Permission,
      Employee,
      AuthAccount,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
