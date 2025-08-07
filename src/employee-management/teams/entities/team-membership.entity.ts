import { AbstractEntity } from '@/database/abstract.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';

import { Employee } from '@/employee-management/employees/entities/employee.entity';
import { Team } from './team.entity';
import { TeamRole } from './team-role.enum';

@ObjectType()
@Entity('team_memberships')
export class TeamMembership extends AbstractEntity<TeamMembership> {
  @ManyToOne(() => Employee, (employee) => employee.teamMemberships)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Field(() => String)
  @RelationId((membership: TeamMembership) => membership.employee)
  employeeId: string;

  @ManyToOne(() => Team, (team) => team.members)
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Field(() => String)
  @RelationId((membership: TeamMembership) => membership.team)
  teamId: string;

  @Field(() => TeamRole)
  @Column({ type: 'enum', enum: TeamRole })
  role: TeamRole;
}
