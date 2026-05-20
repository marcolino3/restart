import { Student } from '@/school-management/students/entities/student.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { AdmissionApplication } from '../entities/admission-application.entity';

@ObjectType()
export class FinalizeEnrollmentOutput {
  @Field(() => AdmissionApplication)
  application: AdmissionApplication;

  @Field(() => Student)
  student: Student;
}
