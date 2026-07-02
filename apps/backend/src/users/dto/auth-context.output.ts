import { ObjectType, Field } from '@nestjs/graphql';
import { Persona } from '@/common/enums/persona.enum';
import { User } from '../entities/user.entity';

@ObjectType()
export class AuthContextOutput {
  @Field(() => User)
  user: User;

  @Field(() => [String])
  roles: string[];

  @Field(() => [String])
  permissions: string[];

  @Field(() => String, { nullable: true })
  orgId?: string;

  @Field(() => String, { nullable: true })
  orgName?: string;

  @Field(() => Persona, { nullable: true })
  persona?: Persona;

  @Field(() => Boolean)
  isSuperAdmin: boolean;

  // True when the caller's own employee record has time tracking enabled —
  // drives visibility of the "Zeiterfassung" nav item.
  @Field(() => Boolean)
  timeTrackingEnabled: boolean;

  // True when the caller's membership belongs to at least one active project —
  // drives visibility of the "Projekte" nav item (members-only navigation).
  @Field(() => Boolean)
  isProjectMember: boolean;
}
