import { Module } from '@nestjs/common';
import { AdmissionAppointmentTypesModule } from './admission-appointment-types/admission-appointment-types.module';
import { AdmissionBoardSettingsModule } from './admission-board-settings/admission-board-settings.module';
import { AdmissionRejectionReasonsModule } from './admission-rejection-reasons/admission-rejection-reasons.module';
import { AdmissionSourcesModule } from './admission-sources/admission-sources.module';
import { AdmissionStagesModule } from './admission-stages/admission-stages.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { ContactPersonsModule } from './contact-persons/contact-persons.module';
import { FamiliesModule } from './families/families.module';
import { GradeLevelsModule } from './grade-levels/grade-levels.module';
import { SchoolClassEnrollmentsModule } from './school-class-enrollments/school-class-enrollments.module';
import { SchoolClassesModule } from './school-classes/school-classes.module';
import { StudentNotesModule } from './student-notes/student-notes.module';
import { StudentRecordsModule } from './student-records/student-records.module';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [
    GradeLevelsModule,
    SchoolClassesModule,
    StudentsModule,
    StudentNotesModule,
    StudentRecordsModule,
    SchoolClassEnrollmentsModule,
    AdmissionStagesModule,
    AdmissionRejectionReasonsModule,
    AdmissionSourcesModule,
    AdmissionAppointmentTypesModule,
    AdmissionBoardSettingsModule,
    ContactPersonsModule,
    FamiliesModule,
    AdmissionsModule,
  ],
})
export class SchoolManagementModule {}
