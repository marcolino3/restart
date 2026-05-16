import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';

export enum EmergencyContactRelationship {
  SPOUSE = 'SPOUSE',
  PARTNER = 'PARTNER',
  PARENT = 'PARENT',
  CHILD = 'CHILD',
  SIBLING = 'SIBLING',
  FRIEND = 'FRIEND',
  OTHER = 'OTHER',
}

registerEnumType(EmergencyContactRelationship, {
  name: 'EmergencyContactRelationship',
});

export enum BloodType {
  A_POS = 'A_POS',
  A_NEG = 'A_NEG',
  B_POS = 'B_POS',
  B_NEG = 'B_NEG',
  AB_POS = 'AB_POS',
  AB_NEG = 'AB_NEG',
  O_POS = 'O_POS',
  O_NEG = 'O_NEG',
}

registerEnumType(BloodType, { name: 'BloodType' });

@ObjectType()
@Entity('employee_emergency_profiles')
@Index('uq_employee_emergency_profile_employee', ['employeeId'], {
  unique: true,
})
@Index('idx_employee_emergency_profile_org', ['organizationId'])
export class EmployeeEmergencyProfile extends AbstractEntity<EmployeeEmergencyProfile> {
  @Field(() => ID)
  @Column('uuid', { name: 'employee_id' })
  employeeId: string;

  @Field(() => Employee)
  @OneToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // --- Notfallkontakt 1 (primär) ---
  @Field(() => String, { nullable: true })
  @Column({
    name: 'contact1_name',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  contact1Name?: string | null;

  @Field(() => EmergencyContactRelationship, { nullable: true })
  @Column({
    name: 'contact1_relationship',
    type: 'enum',
    enum: EmergencyContactRelationship,
    nullable: true,
  })
  contact1Relationship?: EmergencyContactRelationship | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'contact1_phone',
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  contact1Phone?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'contact1_email',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  contact1Email?: string | null;

  // --- Notfallkontakt 2 (sekundär) ---
  @Field(() => String, { nullable: true })
  @Column({
    name: 'contact2_name',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  contact2Name?: string | null;

  @Field(() => EmergencyContactRelationship, { nullable: true })
  @Column({
    name: 'contact2_relationship',
    type: 'enum',
    enum: EmergencyContactRelationship,
    nullable: true,
  })
  contact2Relationship?: EmergencyContactRelationship | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'contact2_phone',
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  contact2Phone?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'contact2_email',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  contact2Email?: string | null;

  // --- Gesundheit ---
  @Field(() => BloodType, { nullable: true })
  @Column({
    name: 'blood_type',
    type: 'enum',
    enum: BloodType,
    nullable: true,
  })
  bloodType?: BloodType | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'allergies', type: 'text', nullable: true })
  allergies?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'chronic_conditions', type: 'text', nullable: true })
  chronicConditions?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'emergency_medications', type: 'text', nullable: true })
  emergencyMedications?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'primary_doctor_name',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  primaryDoctorName?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'primary_doctor_phone',
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  primaryDoctorPhone?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'pharmacy_name',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  pharmacyName?: string | null;
}
