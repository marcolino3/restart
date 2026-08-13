import { Field, ObjectType } from '@nestjs/graphql';
import { EmployeeAbsence } from '../../employee-absences/entities/employee-absence.entity';

/**
 * Result of a sick report. The absence alone cannot tell the caller what
 * happened: a repeated report for an already covered day is a silent no-op
 * server-side, and the UI has to say so instead of claiming success.
 */
@ObjectType()
export class ReportSickLeavePayload {
  @Field(() => EmployeeAbsence)
  absence: EmployeeAbsence;

  /** An existing absence was extended instead of a new one created. */
  @Field(() => Boolean)
  isExtension: boolean;

  /** The day was already covered — nothing was written, nobody notified. */
  @Field(() => Boolean)
  isUnchanged: boolean;
}
