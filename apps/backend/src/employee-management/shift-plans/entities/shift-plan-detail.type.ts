import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Shift } from '@/employee-management/shifts/entities/shift.entity';
import { ShiftPreference } from '@/employee-management/employee-contracts/entities/employee-contract.entity';
import { ShiftCoverageRequirement } from './shift-coverage-requirement.entity';
import { ShiftPlan } from './shift-plan.entity';
import { ShiftAssignment } from './shift-assignment.entity';

/** Display data for an employee that appears in a plan (name only, no HR data). */
@ObjectType()
export class ShiftPlanEmployee {
  @Field(() => ID)
  employeeId!: string;

  @Field(() => String, { nullable: true })
  firstName!: string | null;

  @Field(() => String, { nullable: true })
  lastName!: string | null;
}

/**
 * Someone who may be assigned in the plan: team member (incl. sub-teams) with
 * an active shift-work contract. `availableDates` lists the plan days on which
 * the contract allows shifts and no approved absence / holiday / company
 * vacation blocks the day.
 */
@ObjectType()
export class ShiftPlanCandidate extends ShiftPlanEmployee {
  @Field(() => [String])
  availableDates!: string[];

  @Field(() => [ShiftPreference])
  preferences!: ShiftPreference[];
}

@ObjectType()
export class ShiftPlanTeam {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => Boolean)
  canWrite!: boolean;
}

@ObjectType()
export class ShiftPlanDetail {
  @Field(() => ShiftPlan)
  plan!: ShiftPlan;

  @Field(() => [Shift])
  shifts!: Shift[];

  @Field(() => [ShiftCoverageRequirement])
  coverage!: ShiftCoverageRequirement[];

  @Field(() => [ShiftAssignment])
  assignments!: ShiftAssignment[];

  @Field(() => [ShiftPlanEmployee])
  employees!: ShiftPlanEmployee[];

  /** Empty for callers without write access to the plan. */
  @Field(() => [ShiftPlanCandidate])
  candidates!: ShiftPlanCandidate[];
}
