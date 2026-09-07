import { Organization } from '@/organizations/entities/organization.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Shift } from './shift.entity';

/**
 * Which shifts a team works. Plain join row; `organization_id` is denormalised
 * so every query can filter by tenant without joining through the team.
 */
@ObjectType()
@Entity('team_shifts')
@Index('UQ_team_shift', ['teamId', 'shiftId'], { unique: true })
export class TeamShift {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column('uuid', { name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Field(() => ID)
  @Column('uuid', { name: 'team_id' })
  teamId!: string;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @Field(() => ID)
  @Column('uuid', { name: 'shift_id' })
  shiftId!: string;

  @Field(() => Shift, { nullable: true })
  @ManyToOne(() => Shift, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shift_id' })
  shift!: Shift;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
