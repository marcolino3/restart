import { Persona } from '@/common/enums/persona.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Role } from '@/roles/entities/role.entity';
import { User } from '@/users/entities/user.entity';
import { UserEmail } from '@/user-emails/entities/user-email.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
} from 'typeorm';

@ObjectType()
@Entity('memberships')
@Index('idx_memberships_user', ['userId'])
@Index('idx_memberships_employee', ['employeeId'])
@Index('idx_memberships_org', ['organizationId'])
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

  // Contact email for this org context
  @Field(() => ID, { nullable: true })
  @Column('uuid', { nullable: true, name: 'user_email_id' })
  userEmailId?: string;

  @Field(() => UserEmail, { nullable: true })
  @ManyToOne(() => UserEmail, { nullable: true })
  @JoinColumn({ name: 'user_email_id' })
  userEmail?: UserEmail;

  // Contact phone for this org context
  @Field(() => String, { nullable: true })
  @Column({
    name: 'contact_phone',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  contactPhone?: string;

  // UI color theme chosen by this member for this org context. Stores a
  // theme id from the frontend theme registry (apps/web/lib/themes.ts);
  // unknown/legacy values are ignored by the frontend and fall back to the
  // default theme.
  @Field(() => String, { nullable: true })
  @Column({ name: 'theme', type: 'varchar', length: 30, nullable: true })
  theme?: string | null;

  // Preferred UI/e-mail language for this member in this org context as a
  // locale code (e.g. "de", "en"). Set during onboarding.
  @Field(() => String, { nullable: true })
  @Column({ name: 'language', type: 'varchar', length: 10, nullable: true })
  language?: string | null;

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
