import { Test, TestingModule } from '@nestjs/testing';
import { AddressesResolver } from './addresses.resolver';
import { AddressesService } from './addresses.service';
import { CreateAddressInput } from './dto/create-address.input';
import { UpdateAddressInput } from './dto/update-address.input';
import { PERMS_KEY } from '@/auth/decorators/permissions.decorator';
import {
  guardsOf,
  methodOf,
  overrideAllAuthGuards,
  TEST_ORG_ID,
} from '@/common/testing/auth-test.util';

describe('AddressesResolver', () => {
  let resolver: AddressesResolver;
  let addressesService: {
    findAllByOrgId: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    addressesService = {
      findAllByOrgId: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await overrideAllAuthGuards(
      Test.createTestingModule({
        providers: [
          AddressesResolver,
          { provide: AddressesService, useValue: addressesService },
        ],
      }),
    ).compile();

    resolver = module.get<AddressesResolver>(AddressesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('keeps the resolver behind the auth + access guards', () => {
    expect(guardsOf(AddressesResolver)).toHaveLength(2);
  });

  it('gates each operation with the expected permission', () => {
    const permsOf = (name: keyof AddressesResolver): string[] =>
      (Reflect.getMetadata(PERMS_KEY, methodOf(AddressesResolver, name)) as
        | string[]
        | undefined) ?? [];

    expect(permsOf('findAll')).toEqual(['ADDRESS_READ']);
    expect(permsOf('findOne')).toEqual(['ADDRESS_READ']);
    expect(permsOf('createAddress')).toEqual(['ADDRESS_WRITE']);
    expect(permsOf('updateAddress')).toEqual(['ADDRESS_WRITE']);
    expect(permsOf('deleteAddress')).toEqual(['ADDRESS_DELETE']);
  });

  describe('org-scoped delegation', () => {
    it('findAll passes the current org id through', async () => {
      await resolver.findAll(TEST_ORG_ID);
      expect(addressesService.findAllByOrgId).toHaveBeenCalledWith(TEST_ORG_ID);
    });

    it('findOne scopes the lookup to the current org', async () => {
      await resolver.findOne('addr-1', TEST_ORG_ID);
      expect(addressesService.findOne).toHaveBeenCalledWith(
        'addr-1',
        TEST_ORG_ID,
      );
    });

    it('createAddress scopes the write to the current org', async () => {
      const input = {} as CreateAddressInput;
      await resolver.createAddress(input, TEST_ORG_ID);
      expect(addressesService.create).toHaveBeenCalledWith(input, TEST_ORG_ID);
    });

    it('updateAddress scopes the write to the current org', async () => {
      const input = {} as UpdateAddressInput;
      await resolver.updateAddress(input, TEST_ORG_ID);
      expect(addressesService.update).toHaveBeenCalledWith(input, TEST_ORG_ID);
    });

    it('deleteAddress scopes the delete to the current org', async () => {
      await resolver.deleteAddress('addr-1', TEST_ORG_ID);
      expect(addressesService.remove).toHaveBeenCalledWith(
        'addr-1',
        TEST_ORG_ID,
      );
    });
  });
});
