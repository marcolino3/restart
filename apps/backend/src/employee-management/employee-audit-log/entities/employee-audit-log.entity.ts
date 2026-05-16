import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

export enum EmployeeAuditLogEntityType {
  USER = 'USER',
  MEMBERSHIP = 'MEMBERSHIP',
  EMPLOYEE = 'EMPLOYEE',
}

registerEnumType(EmployeeAuditLogEntityType, {
  name: 'EmployeeAuditLogEntityType',
});

@ObjectType()
@Entity('employee_audit_logs')
@Index('idx_employee_audit_logs_employee', ['employeeId'])
@Index('idx_employee_audit_logs_org', ['organizationId'])
export class EmployeeAuditLog extends AbstractEntity<EmployeeAuditLog> {
  @Field(() => ID)
  @Column('uuid', { name: 'employee_id' })
  employeeId: string;

  @Field(() => Employee)
  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field(() => ID, { nullable: true })
  @Column('uuid', { name: 'actor_membership_id', nullable: true })
  actorMembershipId?: string | null;

  @Field(() => Membership, { nullable: true })
  @ManyToOne(() => Membership, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_membership_id' })
  actorMembership?: Membership | null;

  @Field(() => EmployeeAuditLogEntityType)
  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: EmployeeAuditLogEntityType,
  })
  entityType: EmployeeAuditLogEntityType;

  @Field(() => String)
  @Column({ name: 'field_name', type: 'varchar', length: 120 })
  fieldName: string;

  @Field(() => String, { nullable: true })
  @Column({ name: 'old_value', type: 'text', nullable: true })
  oldValue?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue?: string | null;
}
