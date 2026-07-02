import { Field, ID, InputType, OmitType, PartialType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { CreateProjectTemplateInput } from './create-project-template.input';
import { TemplateTaskInput } from './template-task.input';

@InputType()
export class UpdateProjectTemplateInput extends PartialType(
  OmitType(CreateProjectTemplateInput, ['tasks'] as const),
) {
  @Field(() => ID)
  @IsUUID()
  id: string;

  // When provided, replaces the template's full task list (ordered as given).
  @Field(() => [TemplateTaskInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateTaskInput)
  tasks?: TemplateTaskInput[];
}
