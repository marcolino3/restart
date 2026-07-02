import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AddressesResolver } from './addresses.resolver';
import { AddressesService } from './addresses.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { GraphQLAccessGuard } from '@/auth/guard/graphql-access.guard';
import { CreateAddressInput } from './dto/create-address.input';
import { UpdateAddressInput } from './dto/update-address.input';

describe('AddressesResolver', () => {
  let resolver: AddressesResolver;
  let addressesService: {
    findAllByOrgId: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const orgId = 'org-1';

  beforeEach(async () => {
    addressesService = {
      findAllByOrgId: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ id: 'addr-1' }),
      create: jest.fn().mockResolvedValue({ id: 'addr-1' }),
      update: jest.fn().mockResolvedValue({ id: 'addr-1' }),
      remove: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesResolver,
        { provide: AddressesService, useValue: addressesService },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GraphQLAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<AddressesResolver>(AddressesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findAll (addressesByOrgId)', () => {
    it('delegates to the service scoped to the current org', async () => {
      const addresses = [{ id: 'addr-1' }, { id: 'addr-2' }];
      addressesService.findAllByOrgId.mockResolvedValue(addresses);

      await expect(resolver.findAll(orgId)).resolves.toEqual(addresses);
      expect(addressesService.findAllByOrgId).toHaveBeenCalledWith(orgId);
    });
  });

  describe('findOne (addressById)', () => {
    it('delegates to the service with id and the current org', async () => {
      await resolver.findOne('addr-1', orgId);
      expect(addressesService.findOne).toHaveBeenCalledWith('addr-1', orgId);
    });

    it('propagates NotFoundException when the address belongs to another org', async () => {
      addressesService.findOne.mockRejectedValue(
        new NotFoundException('Address addr-foreign not found'),
      );

      await expect(
        resolver.findOne('addr-foreign', orgId),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(addressesService.findOne).toHaveBeenCalledWith(
        'addr-foreign',
        orgId,
      );
    });
  });

  describe('createAddress', () => {
    it('creates the address in the current org only', async () => {
      const input = { street: 'Main St 1' } as CreateAddressInput;
      await resolver.createAddress(input, orgId);
      expect(addressesService.create).toHaveBeenCalledWith(input, orgId);
    });
  });

  describe('updateAddress', () => {
    it('updates the address scoped to the current org', async () => {
      const input = { id: 'addr-1', street: 'New St 2' } as UpdateAddressInput;
      await resolver.updateAddress(input, orgId);
      expect(addressesService.update).toHaveBeenCalledWith(input, orgId);
    });
  });

  describe('deleteAddress', () => {
    it('removes the address scoped to the current org', async () => {
      await expect(resolver.deleteAddress('addr-1', orgId)).resolves.toBe(true);
      expect(addressesService.remove).toHaveBeenCalledWith('addr-1', orgId);
    });
  });
});
