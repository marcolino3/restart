import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AbstractEntity } from '@/database/abstract.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { SystemEmployeeAbsenceCategory } from '../interfaces/system-employee-absence-categories.enum';

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

  // Menschlich lesbarer Name (kann pro Org ueberschrieben werden)
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  name?: string;

  // System-Grund (Enum) fuer Idempotenz
  @Field(() => SystemEmployeeAbsenceCategory, { nullable: true })
  @Column('enum', {
    name: 'system_code',
    enum: SystemEmployeeAbsenceCategory,
    nullable: true,
  })
  systemCode: SystemEmployeeAbsenceCategory | null;

  // Kennzeichnung: System vs. benutzerdefiniert
  @Field(() => Boolean)
  @Column('boolean', { name: 'is_system', default: false })
  isSystem!: boolean;
}
