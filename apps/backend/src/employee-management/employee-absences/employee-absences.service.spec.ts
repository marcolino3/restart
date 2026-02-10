import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeAbsencesService } from './employee-absences.service';

describe('EmployeeAbsencesService', () => {
  let service: EmployeeAbsencesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeeAbsencesService],
    }).compile();

    service = module.get<EmployeeAbsencesService>(EmployeeAbsencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
