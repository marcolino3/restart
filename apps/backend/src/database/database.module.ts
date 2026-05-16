import { Address } from '@/addresses/entities/address.entity';
import { AuthAccount } from '@/auth-accounts/entities/auth-account.entity';
import { Country } from '@/countries/entities/country.entity';
import { EmployeeAbsenceCategory } from '@/employee-management/employee-absence-categories/entities/employee-absence-category.entity';
import { EmployeeAbsenceDay } from '@/employee-management/employee-absences/entities/employee-absence-days.entity';
import { EmployeeAbsence } from '@/employee-management/employee-absences/entities/employee-absence.entity';
import { EmployeeAuditLog } from '@/employee-management/employee-audit-log/entities/employee-audit-log.entity';
import { EmployeeHrProfile } from '@/employee-management/employee-hr-profiles/entities/employee-hr-profile.entity';
import { EmployeeEmergencyProfile } from '@/employee-management/employee-emergency/entities/employee-emergency-profile.entity';
import { EmployeeNote } from '@/employee-management/employee-notes/entities/employee-note.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { EmployeeContract } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { TeamMember } from '@/employee-management/team-members/entities/team-member.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { TimeTracking } from '@/employee-management/time-tracking/entities/time-tracking.entity';
import { AdmissionStage } from '@/school-management/admission-stages/entities/admission-stage.entity';
import { ContactPerson } from '@/school-management/contact-persons/entities/contact-person.entity';
import { StudentContactPerson } from '@/school-management/contact-persons/entities/student-contact-person.entity';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { CurriculumLevel } from '@/curricula/entities/curriculum-level.entity';
import { CurriculumLevelTranslation } from '@/curricula/entities/curriculum-level-translation.entity';
import { Curriculum } from '@/curricula/entities/curriculum.entity';
import { CurriculumTranslation } from '@/curricula/entities/curriculum-translation.entity';
import { CurriculumNode } from '@/curricula/entities/curriculum-node.entity';
import { CurriculumNodeTranslation } from '@/curricula/entities/curriculum-node-translation.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Permission } from '@/permissions/entities/permission.entity';
import { Role } from '@/roles/entities/role.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import { User } from '@/users/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserEmail,
      Organization,
      Role,
      Membership,
      Permission,
      Address,
      Country,
      Team,
      TeamMember,
      Employee,
      EmployeeContract,
      TimeTracking,
      AuthAccount,
      EmployeeAbsenceCategory,
      EmployeeAbsence,
      EmployeeAbsenceDay,
      EmployeeNote,
      EmployeeAuditLog,
      EmployeeHrProfile,
      EmployeeEmergencyProfile,
      GradeLevel,
      SchoolClass,
      SchoolClassEnrollment,
      Student,
      AdmissionStage,
      ContactPerson,
      StudentContactPerson,
      CurriculumLevel,
      CurriculumLevelTranslation,
      Curriculum,
      CurriculumTranslation,
      CurriculumNode,
      CurriculumNodeTranslation,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
