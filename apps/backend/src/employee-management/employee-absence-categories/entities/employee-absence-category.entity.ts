import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { SystemEmployeeAbsenceCategory } from '../interfaces/system-employee-absence-categories.enum';
import { EmployeeAbsenceCategoryTranslation } from './employee-absence-category-translation.entity';

@ObjectType()
@Entity('employee_absence_categories')
@Unique('uq_employee_absence_categories_org_systemcode', [
  'organizationId',
  'systemCode',
])
@Index('idx_employee_absence_categories_org', ['organizationId'])
export class EmployeeAbsenceCategory extends AbstractEntity<EmployeeAbsenceCategory> {
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization, (org) => org.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  // System-Grund (Enum) fuer Idempotenz; null = Custom-Kategorie der Org
  @Field(() => SystemEmployeeAbsenceCategory, { nullable: true })
  @Column('enum', {
    name: 'system_code',
    enum: SystemEmployeeAbsenceCategory,
    nullable: true,
  })
  systemCode!: SystemEmployeeAbsenceCategory | null;

  // System-Kategorie: nicht loeschbar, Defaults gelockt (Translations bleiben editierbar)
  @Field(() => Boolean)
  @Column('boolean', { name: 'is_system', default: false })
  isSystem!: boolean;

  // Verhalten im Saldo
  @Field(() => Boolean)
  @Column('boolean', { name: 'counts_as_work_time', default: true })
  countsAsWorkTime!: boolean;

  @Field(() => Boolean)
  @Column('boolean', { name: 'is_paid', default: true })
  isPaid!: boolean;

  @Field(() => Boolean)
  @Column('boolean', { name: 'affects_vacation_balance', default: false })
  affectsVacationBalance!: boolean;

  // Ferienfaehigkeit (CH-spezifisch): Default fuer neue Absenz-Instanzen.
  // false = ueberlappende Ferientage werden gutgeschrieben.
  @Field(() => Boolean)
  @Column('boolean', { name: 'default_is_vacation_capable', default: true })
  defaultIsVacationCapable!: boolean;

  // Optionale Ferienkontingent-Kuerzung nach n Krankheitstagen pro Jahr (OR Art. 329b)
  @Field(() => Int, { nullable: true })
  @Column('int', {
    name: 'reduces_vacation_entitlement_after_days',
    nullable: true,
  })
  reducesVacationEntitlementAfterDays!: number | null;

  // Arztzeugnis / Nachweis
  @Field(() => Boolean)
  @Column('boolean', { name: 'requires_certificate', default: false })
  requiresCertificate!: boolean;

  @Field(() => Int, { nullable: true })
  @Column('int', { name: 'certificate_required_from_day', nullable: true })
  certificateRequiredFromDay!: number | null;

  // Limit pro Schuljahr (Hard-Cap)
  @Field(() => Int, { nullable: true })
  @Column('int', { name: 'max_days_per_year', nullable: true })
  maxDaysPerYear!: number | null;

  // Default-Abwesenheitsgrad bei neuer Buchung (z.B. 50% AU)
  @Field(() => Int)
  @Column('int', { name: 'default_percentage', default: 100 })
  defaultPercentage!: number;

  // Approval-Workflow
  @Field(() => Boolean)
  @Column('boolean', { name: 'requires_approval', default: false })
  requiresApproval!: boolean;

  // UI-Hints
  @Field(() => String, { nullable: true })
  @Column('varchar', { length: 7, nullable: true })
  color!: string | null;

  @Field(() => String, { nullable: true })
  @Column('varchar', { name: 'icon_name', nullable: true })
  iconName!: string | null;

  @Field(() => Int)
  @Column('int', { name: 'sort_order', default: 0 })
  sortOrder!: number;

  @Field(() => [EmployeeAbsenceCategoryTranslation], { nullable: true })
  @OneToMany(() => EmployeeAbsenceCategoryTranslation, (t) => t.category, {
    cascade: false,
  })
  translations?: EmployeeAbsenceCategoryTranslation[];
}
