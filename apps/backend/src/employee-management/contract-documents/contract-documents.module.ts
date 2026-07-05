import { Module } from '@nestjs/common';
import { UsersModule } from '@/users/users.module';
import { ContractDocumentsController } from './contract-documents.controller';

/**
 * Authenticated store for contract PDFs (private-uploads/, not public/).
 * Mirrors UploadModule's guard setup via UsersModule (BetterAuthGuard).
 */
@Module({
  imports: [UsersModule],
  controllers: [ContractDocumentsController],
})
export class ContractDocumentsModule {}
