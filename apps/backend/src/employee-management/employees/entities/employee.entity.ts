import { AbstractEntity } from '@/database/abstract.entity';
import { EmployeeAbsence } from '@/employee-management/employee-absences/entities/employee-absence.entity';
import { EmployeeNote } from '@/employee-management/employee-notes/entities/employee-note.entity';
import { Membership } from '@/memberships/entities/membership.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

@ObjectType()
@Entity('employees')
export class Employee extends AbstractEntity<Employee> {
  @Field(() => Membership)
  @OneToOne(() => Membership, (membership) => membership.employee)
  membership: Membership;

  @Field(() => Boolean)
  @Column({ name: 'time_tracking_enabled', type: 'boolean', default: false })
  timeTrackingEnabled!: boolean;

  @Field(() => EmployeeAbsence, { nullable: true })
  @OneToMany(
    () => EmployeeAbsence,
    (employeeAbsence) => employeeAbsence.employee,
    { nullable: true },
  )
  absences?: EmployeeAbsence[];

  @Field(() => [EmployeeNote], { nullable: true })
  @OneToMany(
    () => EmployeeNote,
    (employeeNote) => employeeNote.employee,
    { nullable: true },
  )
  notes?: EmployeeNote[];
}
