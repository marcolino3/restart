import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';

// Re-export for backwards compatibility — canonical source is now EmployeeContract
export {
  EmployeeContractType,
  EmployeePaymentInterval,
} from '@/employee-management/employee-contracts/entities/employee-contract.entity';

export enum EmployeeMaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  REGISTERED_PARTNERSHIP = 'REGISTERED_PARTNERSHIP',
  SEPARATED = 'SEPARATED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
}

registerEnumType(EmployeeMaritalStatus, { name: 'EmployeeMaritalStatus' });

export enum EmployeeResidencePermitType {
  CITIZEN = 'CITIZEN',
  B = 'B',
  C = 'C',
  L = 'L',
  G = 'G',
  F = 'F',
  OTHER = 'OTHER',
}

registerEnumType(EmployeeResidencePermitType, {
  name: 'EmployeeResidencePermitType',
});

export enum EmployeeOnboardingStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

registerEnumType(EmployeeOnboardingStatus, {
  name: 'EmployeeOnboardingStatus',
});

@ObjectType()
@Entity('employee_hr_profiles')
@Index('uq_employee_hr_profile_employee', ['employeeId'], { unique: true })
@Index('idx_employee_hr_profile_org', ['organizationId'])
export class EmployeeHrProfile extends AbstractEntity<EmployeeHrProfile> {
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

  // --- Bankverbindung ---
  @Field(() => String, { nullable: true })
  @Column({ name: 'iban', type: 'varchar', length: 50, nullable: true })
  iban?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'bank_account_holder',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  bankAccountHolder?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'bank_name', type: 'varchar', length: 200, nullable: true })
  bankName?: string | null;

  // --- Versicherungen & Steuern ---
  @Field(() => String, { nullable: true })
  @Column({
    name: 'bvg_provider',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  bvgProvider?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'bvg_insurance_number',
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  bvgInsuranceNumber?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'uvg_provider',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  uvgProvider?: string | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'withholding_tax_code',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  withholdingTaxCode?: string | null;

  // --- Persönliche Stammdaten ---
  @Field(() => String, { nullable: true })
  @Column({ name: 'nationality', type: 'varchar', length: 80, nullable: true })
  nationality?: string | null;

  @Field(() => EmployeeResidencePermitType, { nullable: true })
  @Column({
    name: 'residence_permit_type',
    type: 'enum',
    enum: EmployeeResidencePermitType,
    nullable: true,
  })
  residencePermitType?: EmployeeResidencePermitType | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'residence_permit_valid_until',
    type: 'date',
    nullable: true,
  })
  residencePermitValidUntil?: string | null;

  @Field(() => EmployeeMaritalStatus, { nullable: true })
  @Column({
    name: 'marital_status',
    type: 'enum',
    enum: EmployeeMaritalStatus,
    nullable: true,
  })
  maritalStatus?: EmployeeMaritalStatus | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'denomination',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  denomination?: string | null;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'number_of_children', type: 'int', nullable: true })
  numberOfChildren?: number | null;

  // --- Ferien ---
  @Field(() => Int, { nullable: true })
  @Column({ name: 'annual_vacation_days', type: 'int', nullable: true })
  annualVacationDays?: number | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'remaining_vacation_days',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  remainingVacationDays?: string | null;

  // --- Onboarding / Compliance ---
  @Field(() => EmployeeOnboardingStatus, { nullable: true })
  @Column({
    name: 'onboarding_status',
    type: 'enum',
    enum: EmployeeOnboardingStatus,
    nullable: true,
  })
  onboardingStatus?: EmployeeOnboardingStatus | null;

  @Field(() => Boolean, { nullable: true })
  @Column({ name: 'nda_signed', type: 'boolean', nullable: true })
  ndaSigned?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  @Column({
    name: 'criminal_record_submitted',
    type: 'boolean',
    nullable: true,
  })
  criminalRecordSubmitted?: boolean | null;
}
