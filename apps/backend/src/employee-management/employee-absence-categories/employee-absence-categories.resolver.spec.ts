import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeAbsenceCategoriesResolver } from './employee-absence-categories.resolver';
import { EmployeeAbsenceCategoriesService } from './employee-absence-categories.service';

describe('EmployeeAbsenceCategoriesResolver', () => {
  let resolver: EmployeeAbsenceCategoriesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAbsenceCategoriesResolver,
        { provide: EmployeeAbsenceCategoriesService, useValue: {} },
      ],
    }).compile();

    resolver = module.get<EmployeeAbsenceCategoriesResolver>(EmployeeAbsenceCategoriesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
