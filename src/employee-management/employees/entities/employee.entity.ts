import { AbstractEntity } from '@/database/abstract.entity';
import { IEmployee } from '@/employee-management/employees/interfaces/employee.interface';
import { TeamMembership } from '@/employee-management/teams/entities/team-membership.entity';
import { User } from '@/users/entities/user.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';

@ObjectType()
@Entity('employees')
export class Employee extends AbstractEntity<Employee> implements IEmployee {
  @Field(() => Boolean, { defaultValue: false })
  @Column('boolean', { default: false })
  timeTrackingEnabled: boolean;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.employees, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field(() => String)
  @RelationId((employee: Employee) => employee.user)
  userId: string;

  @Field(() => [TeamMembership])
  @OneToMany(() => TeamMembership, (membership) => membership.employee)
  teamMemberships: TeamMembership[];
}
