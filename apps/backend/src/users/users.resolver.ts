import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { AdminPersonaOnly } from '@/auth/decorators/admin-persona-only.decorator';
import { SuperAdminOnly } from '@/auth/decorators/super-admin.decorator';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { ChangeUserEmailInput } from './dto/change-user-email.input';
import { AuthContextOutput } from './dto/auth-context.output';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { Organization } from '@/organizations/entities/organization.entity';

@Resolver(() => User)
@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    @InjectEntityManager() private readonly em: EntityManager,
  ) {}

  @Mutation(() => User)
  @SuperAdminOnly()
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => User, { name: 'currentUser' })
  currentUser(@CurrentUser() user: TokenPayload) {
    return this.usersService.findCurrentUser(user.sub);
  }

  @Query(() => AuthContextOutput, { name: 'authContext' })
  async authContext(
    @CurrentUser() user: TokenPayload,
  ): Promise<AuthContextOutput> {
    const fullUser = await this.usersService.findCurrentUser(user.sub);
    if (!fullUser) throw new NotFoundException('User not found');
    const [timeTrackingEnabled, isProjectMember] = await Promise.all([
      this.resolveTimeTrackingEnabled(user),
      this.resolveIsProjectMember(user),
    ]);

    // Surface the active organization's name so the frontend can show the
    // school name in the sidebar header (multi-tenant: only the active org).
    let orgName: string | undefined;
    if (user.orgId) {
      const org = await this.em.findOne(Organization, {
        where: { id: user.orgId },
        select: { id: true, name: true },
      });
      orgName = org?.name ?? undefined;
    }
    return {
      user: fullUser,
      roles: user.roles ?? [],
      permissions: user.permissions ?? [],
      orgId: user.orgId,
      orgName,
      persona: user.persona,
      isSuperAdmin: user.isSuperAdmin ?? false,
      timeTrackingEnabled,
      isProjectMember,
    };
  }

  /** Own employee's time_tracking_enabled flag (false without employee record). */
  private async resolveTimeTrackingEnabled(
    user: TokenPayload,
  ): Promise<boolean> {
    if (!user.membershipId || !user.orgId) return false;
    const rows: Array<{ enabled: boolean }> = await this.em.query(
      `SELECT e.time_tracking_enabled AS enabled
         FROM memberships m
         INNER JOIN employees e ON e.id = m.employee_id
         WHERE m.id = $1 AND m.organization_id = $2 AND e."isActive" = true
         LIMIT 1`,
      [user.membershipId, user.orgId],
    );
    return rows[0]?.enabled ?? false;
  }

  /** Whether the membership belongs to at least one active project. */
  private async resolveIsProjectMember(user: TokenPayload): Promise<boolean> {
    if (!user.membershipId || !user.orgId) return false;
    const rows: Array<{ is_member: boolean }> = await this.em.query(
      `SELECT EXISTS (
           SELECT 1
           FROM project_members pm
           INNER JOIN projects p
             ON p.id = pm.project_id AND p."isActive" = true
           WHERE pm.membership_id = $1
             AND pm.organization_id = $2
             AND pm."isActive" = true
         ) AS is_member`,
      [user.membershipId, user.orgId],
    );
    return rows[0]?.is_member ?? false;
  }

  @Query(() => [User], { name: 'users' })
  @SuperAdminOnly()
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  @SuperAdminOnly()
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  @Permissions('EMPLOYEE_WRITE')
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput);
  }

  /**
   * Ändert die primäre E-Mail eines Users synchron in TypeORM `user_emails`
   * UND better-auth `user.email` (Login). Admin/HR only.
   */
  @Mutation(() => User)
  @AdminPersonaOnly()
  @Permissions('EMPLOYEE_WRITE')
  changeUserEmail(@Args('input') input: ChangeUserEmailInput) {
    return this.usersService.changeUserEmail(input.userId, input.newEmail);
  }

  /**
   * Translates a Restart `users.id` (UUID) into the corresponding
   * better-auth `user.id` (text). Joins via shared email — the two tables
   * are otherwise independent. SuperAdmin only since the only consumer is
   * the impersonation flow.
   */
  @Query(() => String, { name: 'authUserIdByUserId', nullable: true })
  @SuperAdminOnly()
  async authUserIdByUserId(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<string | null> {
    const rows: Array<{ id: string }> = await this.em.query(
      `SELECT au.id
         FROM "user" au
         INNER JOIN user_emails ue ON LOWER(ue.email) = LOWER(au.email)
         WHERE ue.user_id = $1
         LIMIT 1`,
      [userId],
    );
    return rows[0]?.id ?? null;
  }

  @Mutation(() => User)
  @Permissions('USER_REMOVE')
  removeUser(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.remove(id);
  }
}
