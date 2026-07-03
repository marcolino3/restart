import { Field, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';

@InputType()
export class UpdateMyThemeInput {
  // Theme ids are lowercase slugs from the frontend theme registry
  // (apps/web/lib/themes.ts, e.g. "salbei"). The backend only enforces the
  // shape — the frontend validates against the actual registry on read.
  @Field(() => String)
  @Matches(/^[a-z][a-z0-9-]{1,29}$/)
  theme!: string;
}
