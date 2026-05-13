import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthAccount } from './entities/auth-account.entity';
import { AuthProvider } from './interfaces/auth-provider.enum';

@Injectable()
export class AuthAccountsService {
  constructor(
    @InjectRepository(AuthAccount)
    private readonly repo: Repository<AuthAccount>,
  ) {}

  async findByProviderAndId(
    provider: AuthProvider,
    providerId: string,
  ): Promise<AuthAccount | null> {
    return this.repo.findOne({ where: { provider, providerId } });
  }

  async findByUserEmailId(userEmailId: string): Promise<AuthAccount[]> {
    return this.repo.find({ where: { userEmailId } });
  }

  async linkProvider(
    userEmailId: string,
    provider: AuthProvider,
    providerId: string,
  ): Promise<AuthAccount> {
    const aa = this.repo.create({ userEmailId, provider, providerId });
    return this.repo.save(aa);
  }

  async unlinkProvider(authAccountId: string): Promise<void> {
    const aa = await this.repo.findOneBy({ id: authAccountId });
    if (!aa) throw new NotFoundException('AuthAccount not found');
    await this.repo.remove(aa);
  }
}
