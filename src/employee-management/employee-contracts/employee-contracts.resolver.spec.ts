import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeContractsResolver } from './employee-contracts.resolver';
import { EmployeeContractsService } from './employee-contracts.service';

describe('EmployeeContractsResolver', () => {
  let resolver: EmployeeContractsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeeContractsResolver, EmployeeContractsService],
    }).compile();

    resolver = module.get<EmployeeContractsResolver>(EmployeeContractsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
