import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { TestingModuleBuilder } from '@nestjs/testing';

import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { GraphQLPermissionsGuard } from '@/auth/guard/graphql-permissions.guard';
import { GraphQLRolesGuard } from '@/auth/guard/graphql-roles.guard';
import { MembershipGuard } from '@/auth/guard/membership.guard';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';
import type { TokenPayload } from '@/auth/interfaces/token-payload.interface';

/**
 * Shared testing helpers for org-scoped resolvers/services.
 *
 * The goal is to make the two invariants CLAUDE.md requires — permission
 * gating and multi-tenant isolation — cheap to assert consistently across
 * modules, instead of every spec re-implementing guard mocks and cross-org
 * probes by hand.
 */

export const TEST_ORG_ID = 'org-1';
export const TEST_OTHER_ORG_ID = 'org-2';

const PASSING_GUARD = { canActivate: () => true };

/**
 * Overrides every auth/RBAC guard on a TestingModule builder so a resolver can
 * be unit-tested without a real session. Guard *wiring* is asserted separately
 * via `guardsOf()` on the reflected metadata — this only neutralises runtime
 * enforcement for the method-under-test.
 */
export function overrideAllAuthGuards(
  builder: TestingModuleBuilder,
): TestingModuleBuilder {
  return builder
    .overrideGuard(GqlBetterAuthGuard)
    .useValue(PASSING_GUARD)
    .overrideGuard(GraphQLAccessGuard)
    .useValue(PASSING_GUARD)
    .overrideGuard(GraphQLPermissionsGuard)
    .useValue(PASSING_GUARD)
    .overrideGuard(GraphQLRolesGuard)
    .useValue(PASSING_GUARD)
    .overrideGuard(SuperAdminGuard)
    .useValue(PASSING_GUARD)
    .overrideGuard(MembershipGuard)
    .useValue(PASSING_GUARD);
}

/** Builds a `TokenPayload` for the active org, overridable per test. */
export function mockUser(overrides: Partial<TokenPayload> = {}): TokenPayload {
  return {
    sub: 'user-1',
    orgId: TEST_ORG_ID,
    membershipId: 'membership-1',
    roles: [],
    permissions: [],
    isSuperAdmin: false,
    ...overrides,
  };
}

/**
 * Reads the guard classes attached to a resolver class or method, so specs can
 * assert "this mutation is still gated" without instantiating anything.
 * Pass the class for class-level `@UseGuards`, or a prototype method for
 * method-level guards.
 */
export function guardsOf(target: object): unknown[] {
  return (Reflect.getMetadata('__guards__', target) as unknown[]) ?? [];
}

/** Reads a prototype method as a plain value without an unbound-method access. */
export function methodOf<T extends object>(
  cls: new (...args: never[]) => T,
  name: keyof T,
): object {
  return Object.getOwnPropertyDescriptor(cls.prototype, name)?.value as object;
}

/**
 * Minimal GraphQL ExecutionContext for unit-testing guards directly.
 * `GqlExecutionContext.create(ctx).getContext()` resolves to `{ req: { user } }`,
 * and handler/class carry the reflected decorator metadata the guard reads.
 */
export function mockGqlExecutionContext(opts: {
  user?: Partial<TokenPayload> | null;
  handler?: (...args: never[]) => unknown;
  class?: new (...args: never[]) => unknown;
}): ExecutionContext {
  const req = { user: opts.user ?? undefined };
  const gqlArgs = [undefined, undefined, { req }, undefined];
  const handler = opts.handler ?? (() => undefined);
  const cls = opts.class ?? class {};

  return {
    getType: () => 'graphql',
    getClass: () => cls,
    getHandler: () => handler,
    getArgs: () => gqlArgs,
    getArgByIndex: (i: number) => gqlArgs[i],
    switchToHttp: () => ({ getRequest: () => req }),
    switchToRpc: () => ({}),
    switchToWs: () => ({}),
  } as unknown as ExecutionContext;
}

/** Asserts that a cross-org access attempt is rejected as NotFound (404-masking). */
export async function expectCrossOrgNotFound(
  fn: () => Promise<unknown>,
): Promise<void> {
  await expect(fn()).rejects.toBeInstanceOf(NotFoundException);
}
