import { Persona } from '@/common/enums/persona.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Role } from '@/roles/entities/role.entity';
import { User } from '@/users/entities/user.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
} from 'typeorm';

@ObjectType()
@Entity('memberships')
export class Membership extends AbstractEntity<Membership> {
  // Organization
  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @Field(() => Organization)
  @ManyToOne(() => Organization, (organization) => organization.memberships)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  // Roles
  @Field(() => [Role], { nullable: true })
  @ManyToMany(() => Role, { eager: false })
  @JoinTable({
    name: 'membership_roles',
    joinColumn: { name: 'membership_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles?: Role[];

  // Persona
  @Field(() => Persona)
  @Column({ name: 'persona', type: 'enum', enum: Persona })
  persona!: Persona;

  // User
  @Field(() => ID)
  @Column('uuid', { name: 'user_id' })
  userId?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.memberships, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  // Employee
  @Field(() => String, { nullable: true })
  @Column('uuid', { nullable: true, name: 'employee_id' })
  employeeId: string;

  @Field(() => Employee, { nullable: true })
  @OneToOne(() => Employee, (employee) => employee.membership, {
    nullable: true,
  })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;
}
