import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { PublicAssetController } from './public-asset.controller';

/**
 * Global object-storage layer for all uploads (S3-compatible in production,
 * local filesystem in dev/CI). Exports StorageService so upload controllers
 * can inject it; the PublicAssetController proxies public assets.
 */
@Global()
@Module({
  controllers: [PublicAssetController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
