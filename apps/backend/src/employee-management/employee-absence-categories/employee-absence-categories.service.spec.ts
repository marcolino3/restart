import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { EmployeeAbsenceCategoriesService } from './employee-absence-categories.service';

describe('EmployeeAbsenceCategoriesService', () => {
  let service: EmployeeAbsenceCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAbsenceCategoriesService,
        { provide: EntityManager, useValue: {} },
      ],
    }).compile();

    service = module.get<EmployeeAbsenceCategoriesService>(
      EmployeeAbsenceCategoriesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
