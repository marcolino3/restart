import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsResolver } from './memberships.resolver';
import { MembershipsService } from './memberships.service';
import { CreateMembershipInput } from './dto/create-membership.input';
import { UpdateMembershipInput } from './dto/update-membership.input';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import {
  guardsOf,
  methodOf,
  overrideAllAuthGuards,
  TEST_ORG_ID,
} from '@/common/testing/auth-test.util';

describe('MembershipsResolver', () => {
  let resolver: MembershipsResolver;
  let membershipsService: {
    create: jest.Mock;
    findByOrgId: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    membershipsService = {
      create: jest.fn().mockResolvedValue(null),
      findByOrgId: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await overrideAllAuthGuards(
      Test.createTestingModule({
        providers: [
          MembershipsResolver,
          { provide: MembershipsService, useValue: membershipsService },
        ],
      }),
    ).compile();

    resolver = module.get<MembershipsResolver>(MembershipsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('keeps the resolver behind the auth + access guards', () => {
    expect(guardsOf(MembershipsResolver)).toHaveLength(2);
  });

  it('gates each operation with the expected permission', () => {
    const permsOf = (name: keyof MembershipsResolver): string[] =>
      (Reflect.getMetadata(PERMS_KEY, methodOf(MembershipsResolver, name)) as
        | string[]
        | undefined) ?? [];

    expect(permsOf('createMembership')).toEqual(['USER_INVITE']);
    expect(permsOf('findByOrgId')).toEqual(['EMPLOYEE_READ']);
    expect(permsOf('updateMembership')).toEqual(['EMPLOYEE_WRITE']);
  });

  describe('delegation', () => {
    it('createMembership forwards the input to the service', async () => {
      const input = {} as CreateMembershipInput;
      await resolver.createMembership(input);
      expect(membershipsService.create).toHaveBeenCalledWith(input);
    });

    it('findByOrgId scopes the query to the requested org', async () => {
      await resolver.findByOrgId(TEST_ORG_ID);
      expect(membershipsService.findByOrgId).toHaveBeenCalledWith(TEST_ORG_ID);
    });

    it('updateMembership forwards the input to the service', async () => {
      const input = {} as UpdateMembershipInput;
      await resolver.updateMembership(input);
      expect(membershipsService.update).toHaveBeenCalledWith(input);
    });
  });
});
