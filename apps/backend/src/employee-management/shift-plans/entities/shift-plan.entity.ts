import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '@/organizations/entities/organization.entity';
import { Team } from '@/employee-management/teams/entities/team.entity';
import { ShiftPlanSource, ShiftPlanStatus } from './shift-plan-enums';

/** A shift plan for one team and one date range (inclusive). */
@ObjectType()
@Entity('shift_plans')
@Index('IDX_shift_plans_org_team', ['organizationId', 'teamId'])
export class ShiftPlan {
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

  /** YYYY-MM-DD */
  @Field(() => String)
  @Column('date', { name: 'start_date' })
  startDate!: string;

  /** YYYY-MM-DD */
  @Field(() => String)
  @Column('date', { name: 'end_date' })
  endDate!: string;

  @Field(() => ShiftPlanStatus)
  @Column('varchar', { length: 16, default: ShiftPlanStatus.DRAFT })
  status!: ShiftPlanStatus;

  @Field(() => ShiftPlanSource)
  @Column('varchar', { length: 16, default: ShiftPlanSource.MANUAL })
  source!: ShiftPlanSource;

  @Column('uuid', { name: 'created_by_membership_id', nullable: true })
  createdByMembershipId!: string | null;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
