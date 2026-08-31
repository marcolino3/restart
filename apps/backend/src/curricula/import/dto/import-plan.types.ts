import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CurriculumLocale } from '../../enums/curriculum-locale.enum';
import { CurriculumNodeType } from '../../enums/curriculum-node-type.enum';
import { ImportIssue } from '../import-issue';

@ObjectType('CurriculumImportPlanTranslation')
export class ImportPlanTranslationType {
  @Field(() => CurriculumLocale)
  locale: CurriculumLocale;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  notes?: string | null;
}

@ObjectType('CurriculumImportPlanNode')
export class ImportPlanNodeType {
  @Field(() => String)
  tempId: string;

  @Field(() => CurriculumNodeType)
  nodeType: CurriculumNodeType;

  @Field(() => Int)
  position: number;

  @Field(() => [ImportPlanTranslationType])
  translations: ImportPlanTranslationType[];

  @Field(() => [ImportPlanNodeType])
  children: ImportPlanNodeType[];

  @Field(() => Int, { nullable: true })
  sourceRowNumber?: number | null;
}

@ObjectType('CurriculumImportPlanLevel')
export class ImportPlanLevelType {
  @Field(() => String)
  slug: string;

  @Field(() => Int)
  position: number;

  @Field(() => [ImportPlanTranslationType])
  translations: ImportPlanTranslationType[];

  @Field(() => [ImportPlanNodeType])
  roots: ImportPlanNodeType[];
}

@ObjectType('CurriculumImportPlanStats')
export class ImportPlanStatsType {
  @Field(() => Int)
  rowCount: number;

  @Field(() => Int)
  levelCount: number;

  @Field(() => Int)
  areaCount: number;

  @Field(() => Int)
  topicCount: number;

  @Field(() => Int)
  groupCount: number;

  @Field(() => Int)
  lessonCount: number;
}

@ObjectType('CurriculumImportPlan')
export class ImportPlanType {
  @Field(() => CurriculumLocale)
  sourceLocale: CurriculumLocale;

  @Field(() => [ImportPlanLevelType])
  levels: ImportPlanLevelType[];

  @Field(() => ImportPlanStatsType)
  stats: ImportPlanStatsType;

  // Structured issues (code + params + English fallback). The plan is only
  // ever delivered via the REST preview endpoint, never via GraphQL, so the
  // field carries no @Field decorator.
  warnings: ImportIssue[];
}
