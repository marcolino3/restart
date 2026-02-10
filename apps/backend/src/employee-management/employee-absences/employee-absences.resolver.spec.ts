import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeAbsencesResolver } from './employee-absences.resolver';
import { EmployeeAbsencesService } from './employee-absences.service';

describe('EmployeeAbsencesResolver', () => {
  let resolver: EmployeeAbsencesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAbsencesResolver,
        { provide: EmployeeAbsencesService, useValue: {} },
      ],
    }).compile();

    resolver = module.get<EmployeeAbsencesResolver>(EmployeeAbsencesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
