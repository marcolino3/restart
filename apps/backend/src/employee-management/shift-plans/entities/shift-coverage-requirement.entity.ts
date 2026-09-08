import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from '@/organizations/entities/organization.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { Shift } from '@/employee-management/shifts/entities/shift.entity';

/**
 * How many people a team needs in a shift on a given weekday. One row per
 * team x shift x weekday; missing row = no requirement.
 */
@ObjectType()
@Entity('shift_coverage_requirements')
@Index('UQ_shift_coverage', ['teamId', 'shiftId', 'weekday'], { unique: true })
export class ShiftCoverageRequirement {
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

  @ManyToOne(() => Shift, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shift_id' })
  shift!: Shift;

  /** mon..sun */
  @Field(() => String)
  @Column('varchar', { length: 3 })
  weekday!: string;

  @Field(() => Int)
  @Column('integer', { name: 'required_count', default: 0 })
  requiredCount!: number;
}
