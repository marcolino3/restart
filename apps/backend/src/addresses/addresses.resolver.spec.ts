import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressesResolver } from './addresses.resolver';
import { AddressesService } from './addresses.service';
import { Address } from './entities/address.entity';

describe('AddressesResolver', () => {
  let resolver: AddressesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesResolver,
        AddressesService,
        {
          provide: getRepositoryToken(Address),
          useValue: {},
        },
      ],
    }).compile();

    resolver = module.get<AddressesResolver>(AddressesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
