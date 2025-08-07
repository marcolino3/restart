import { Test, TestingModule } from '@nestjs/testing';
import { AuthAccountsService } from './auth-accounts.service';

describe('AuthAccountsService', () => {
  let service: AuthAccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthAccountsService],
    }).compile();

    service = module.get<AuthAccountsService>(AuthAccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
