import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeContractsService } from './employee-contracts.service';

describe('EmployeeContractsService', () => {
  let service: EmployeeContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeeContractsService],
    }).compile();

    service = module.get<EmployeeContractsService>(EmployeeContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
