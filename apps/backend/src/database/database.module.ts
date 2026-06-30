import { Address } from '@/addresses/entities/address.entity';
import { AuthAccount } from '@/auth-accounts/entities/auth-account.entity';
import { Country } from '@/countries/entities/country.entity';
import { CountryInputTemplate } from '@/country-input-templates/entities/country-input-template.entity';
import { EmployeeAbsenceCategory } from '@/employee-management/employee-absence-categories/entities/employee-absence-category.entity';
import { EmployeeAbsenceCategoryTranslation } from '@/employee-management/employee-absence-categories/entities/employee-absence-category-translation.entity';
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
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';
import { CompanyVacation } from '@/employee-management/company-vacations/entities/company-vacation.entity';
import { EmployeeVacation } from '@/employee-management/employee-vacations/entities/employee-vacation.entity';
import { TimeTrackingPeriod } from '@/employee-management/time-tracking-periods/entities/time-tracking-period.entity';
import { EmployeePeriodOpeningBalance } from '@/employee-management/time-tracking-periods/entities/employee-period-opening-balance.entity';
import { EmployeePaidOvertime } from '@/employee-management/employee-paid-overtime/entities/employee-paid-overtime.entity';
import { WorkDayBalance } from '@/employee-management/work-day-balances/entities/work-day-balance.entity';
import { AdmissionStage } from '@/school-management/admission-stages/entities/admission-stage.entity';
import { AdmissionRejectionReason } from '@/school-management/admission-rejection-reasons/entities/admission-rejection-reason.entity';
import { AdmissionBoardSettings } from '@/school-management/admission-board-settings/entities/admission-board-settings.entity';
import { AdmissionActivity } from '@/school-management/admissions/entities/admission-activity.entity';
import { AdmissionApplication } from '@/school-management/admissions/entities/admission-application.entity';
import { AdmissionAuditLog } from '@/school-management/admissions/entities/admission-audit-log.entity';
import { AdmissionEmail } from '@/school-management/admissions/entities/admission-email.entity';
import { AdmissionReminder } from '@/school-management/admissions/entities/admission-reminder.entity';
import { EmailTemplate } from '@/school-management/admissions/entities/email-template.entity';
import { ContactPerson } from '@/school-management/contact-persons/entities/contact-person.entity';
import { StudentContactPerson } from '@/school-management/contact-persons/entities/student-contact-person.entity';
import { Family } from '@/school-management/families/entities/family.entity';
import { GradeLevel } from '@/school-management/grade-levels/entities/grade-level.entity';
import { SchoolClassEnrollment } from '@/school-management/school-class-enrollments/entities/school-class-enrollment.entity';
import { SchoolClass } from '@/school-management/school-classes/entities/school-class.entity';
import { StudentNote } from '@/school-management/student-notes/entities/student-note.entity';
import { Student } from '@/school-management/students/entities/student.entity';
import { CurriculumLevel } from '@/curricula/entities/curriculum-level.entity';
import { CurriculumLevelTranslation } from '@/curricula/entities/curriculum-level-translation.entity';
import { Curriculum } from '@/curricula/entities/curriculum.entity';
import { CurriculumTranslation } from '@/curricula/entities/curriculum-translation.entity';
import { CurriculumNode } from '@/curricula/entities/curriculum-node.entity';
import { CurriculumNodeTranslation } from '@/curricula/entities/curriculum-node-translation.entity';
import { LessonRecord } from '@/curricula/record-keeping/entities/lesson-record.entity';
import { RecordKeepingSettings } from '@/curricula/record-keeping/entities/record-keeping-settings.entity';
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
      CountryInputTemplate,
      Team,
      TeamMember,
      Employee,
      EmployeeContract,
      TimeTracking,
      Holiday,
      CompanyVacation,
      EmployeeVacation,
      TimeTrackingPeriod,
      EmployeePeriodOpeningBalance,
      EmployeePaidOvertime,
      WorkDayBalance,
      AuthAccount,
      EmployeeAbsenceCategory,
      EmployeeAbsenceCategoryTranslation,
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
      StudentNote,
      AdmissionStage,
      AdmissionRejectionReason,
      AdmissionBoardSettings,
      AdmissionApplication,
      AdmissionAuditLog,
      AdmissionActivity,
      AdmissionReminder,
      AdmissionEmail,
      EmailTemplate,
      ContactPerson,
      StudentContactPerson,
      Family,
      CurriculumLevel,
      CurriculumLevelTranslation,
      Curriculum,
      CurriculumTranslation,
      CurriculumNode,
      CurriculumNodeTranslation,
      LessonRecord,
      RecordKeepingSettings,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
