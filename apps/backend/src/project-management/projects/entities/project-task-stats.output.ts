import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * Aggregierte Aufgaben-Zahlen eines Projekts — treibt Fortschrittsbalken und
 * "X von Y Aufgaben erledigt" in Projektliste und -detail.
 */
@ObjectType()
export class ProjectTaskStats {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  done: number;
}
