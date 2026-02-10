import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { EmployeeAbsencesService } from './employee-absences.service';
import { GoogleCalendarService } from '@/google/google-calendar.service';

describe('EmployeeAbsencesService', () => {
  let service: EmployeeAbsencesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAbsencesService,
        { provide: EntityManager, useValue: {} },
        { provide: GoogleCalendarService, useValue: {} },
      ],
    }).compile();

    service = module.get<EmployeeAbsencesService>(EmployeeAbsencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
