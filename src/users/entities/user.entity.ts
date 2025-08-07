import { AbstractEntity } from '@/database/abstract.entity';
import { Gender } from '@/database/enums/gender.enum';
import { PreferredLanguage } from '@/database/enums/preferredLanguage.enum';
import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Organization } from '@/organizations/entities/organization.entity';
import { Role } from '@/roles/entities/role.entity';
import { IUser } from '@/users/interfaces/user.interface';
import { Field, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  RelationId,
} from 'typeorm';

@ObjectType()
@Entity()
export class User extends AbstractEntity<User> implements IUser {
  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  salutation?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  title?: string;

  @Field(() => String)
  @Column('text')
  firstName: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  middleName?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  displayName?: string;

  @Field(() => String)
  @Column('text')
  lastName: string;

  @Field(() => Date, { nullable: true })
  @Column('timestamptz', { nullable: true })
  birthDate: Date;

  @Field(() => Gender, { nullable: true })
  @Column('enum', { enum: Gender, nullable: true })
  gender: Gender;

  @Field(() => PreferredLanguage, { defaultValue: 'DE' })
  @Column('enum', { enum: PreferredLanguage, default: 'DE' })
  preferredLanguage: PreferredLanguage;

  @Field(() => String)
  @Column('text', { unique: true })
  email: string;

  @Field(() => Boolean, { defaultValue: false })
  @Column('boolean', { default: false })
  emailVerified: boolean;

  @Field(() => String)
  @Column('text')
  password: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  refreshToken?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  mobilePhoneNumber?: string;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  profileImageUrl?: string;

  @Field(() => [String], { nullable: true })
  @RelationId((user: User) => user.roles)
  roleIds: string[];

  @Field(() => [Role], { nullable: true })
  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable()
  roles: Role[];

  @Field(() => String)
  @RelationId((user: User) => user.organizations)
  organizationIds: string[];

  @Field(() => [Organization])
  @ManyToMany(() => Organization, (organization) => organization.users)
  organizations: Organization[];

  @Field(() => [Employee], { nullable: true })
  @OneToMany(() => Employee, (employee) => employee.user)
  employees?: Employee[];
}
