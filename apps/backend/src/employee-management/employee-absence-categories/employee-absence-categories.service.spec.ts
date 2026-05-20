import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { EmployeeAbsenceCategoriesService } from './employee-absence-categories.service';
import { EmployeeAbsenceCategory } from './entities/employee-absence-category.entity';
import { EmployeeAbsenceCategoryTranslation } from './entities/employee-absence-category-translation.entity';

describe('EmployeeAbsenceCategoriesService', () => {
  let service: EmployeeAbsenceCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAbsenceCategoriesService,
        { provide: getRepositoryToken(EmployeeAbsenceCategory), useValue: {} },
        {
          provide: getRepositoryToken(EmployeeAbsenceCategoryTranslation),
          useValue: {},
        },
        { provide: DataSource, useValue: {} },
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
