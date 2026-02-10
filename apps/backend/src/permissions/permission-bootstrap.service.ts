import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { seedPermissionCatalog } from './seeds/permission-catalog.seeder';

@Injectable()
export class PermissionBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PermissionBootstrapService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.dataSource.transaction(seedPermissionCatalog);
    this.logger.log('Permission catalog seeded/updated.');
  }
}
