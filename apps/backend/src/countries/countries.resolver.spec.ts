import { Test, TestingModule } from '@nestjs/testing';
import { CountriesResolver } from './countries.resolver';
import { CountriesService } from './countries.service';
import { GqlBetterAuthGuard } from '@/auth/guard/gql-better-auth.guard';
import { SuperAdminGuard } from '@/auth/guard/super-admin.guard';

// Prototype-Methoden ohne Member-Access referenzieren (unbound-method-Regel)
const methodOf = (name: keyof CountriesResolver): object =>
  Object.getOwnPropertyDescriptor(CountriesResolver.prototype, name)
    ?.value as object;

describe('CountriesResolver', () => {
  let resolver: CountriesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountriesResolver,
        {
          provide: CountriesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(GqlBetterAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SuperAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<CountriesResolver>(CountriesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('security metadata (regression: mutations were callable unauthenticated)', () => {
    it('requires an authenticated session on the resolver', () => {
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', CountriesResolver) ?? [];
      expect(guards).toContain(GqlBetterAuthGuard);
    });

    it.each([
      ['createCountry', methodOf('createCountry')],
      ['updateCountry', methodOf('updateCountry')],
      ['removeCountry', methodOf('removeCountry')],
    ])('%s is SuperAdmin-only', (_name, handler) => {
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', handler) ?? [];
      expect(guards).toContain(SuperAdminGuard);
    });

    it.each([
      ['countries', methodOf('findAll')],
      ['country', methodOf('findOne')],
    ])('query %s stays readable for authenticated users', (_name, handler) => {
      const guards: unknown[] =
        Reflect.getMetadata('__guards__', handler) ?? [];
      expect(guards).not.toContain(SuperAdminGuard);
    });
  });
});
