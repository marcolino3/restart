import { Module } from '@nestjs/common';
import { AdmissionStagesModule } from './admission-stages/admission-stages.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { ContactPersonsModule } from './contact-persons/contact-persons.module';
import { FamiliesModule } from './families/families.module';
import { GradeLevelsModule } from './grade-levels/grade-levels.module';
import { SchoolClassEnrollmentsModule } from './school-class-enrollments/school-class-enrollments.module';
import { SchoolClassesModule } from './school-classes/school-classes.module';
import { StudentNotesModule } from './student-notes/student-notes.module';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [
    GradeLevelsModule,
    SchoolClassesModule,
    StudentsModule,
    StudentNotesModule,
    SchoolClassEnrollmentsModule,
    AdmissionStagesModule,
    ContactPersonsModule,
    FamiliesModule,
    AdmissionsModule,
  ],
})
export class SchoolManagementModule {}
