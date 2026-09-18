import { Module } from '@nestjs/common';
import { UsersModule } from '@/users/users.module';
import { ContractDocumentsController } from './contract-documents.controller';
import { ContractGenerationService } from './contract-generation.service';

/**
 * Authenticated store for contract PDFs (private-uploads/, not public/).
 * Mirrors UploadModule's guard setup via UsersModule (BetterAuthGuard).
 * Also renders generated contract documents (PDF stored, DOCX download).
 */
@Module({
  imports: [UsersModule],
  controllers: [ContractDocumentsController],
  providers: [ContractGenerationService],
})
export class ContractDocumentsModule {}
