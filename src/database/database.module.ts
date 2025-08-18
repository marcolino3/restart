import { Address } from '@/addresses/entities/address.entity';
import { AuthAccount } from '@/auth-accounts/entities/auth-account.entity';
import { Country } from '@/countries/entities/country.entity';
import { EmployeeAbsenceCategory } from '@/employee-management/employee-absence-categories/entities/employee-absence-category.entity';
import { EmployeeAbsenceDay } from '@/employee-management/employee-absences/entities/employee-absence-days.entity';
import { EmployeeAbsence } from '@/employee-management/employee-absences/entities/employee-absence.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { TeamMember } from '@/employee-management/team-members/entities/team-member.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { Membership } from '@/memberships/entities/membership.entity';
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
      Membership,
      Permission,
      Address,
      Country,
      Team,
      TeamMember,
      Employee,
      AuthAccount,
      EmployeeAbsenceCategory,
      EmployeeAbsence,
      EmployeeAbsenceDay,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
