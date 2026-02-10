import { Test, TestingModule } from '@nestjs/testing';
import { TimeTrackingResolver } from './time-tracking.resolver';
import { TimeTrackingService } from './time-tracking.service';

describe('TimeTrackingResolver', () => {
  let resolver: TimeTrackingResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeTrackingResolver, TimeTrackingService],
    }).compile();

    resolver = module.get<TimeTrackingResolver>(TimeTrackingResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
