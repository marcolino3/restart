import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { StorageModule } from '@/storage/storage.module';
import { TeamsModule } from '@/employee-management/teams/teams.module';
import { ChatsService } from './chats.service';
import { ChatsResolver } from './chats.resolver';
import { ChatAttachmentsController } from './chat-attachments.controller';
import { pubSubProvider } from './pubsub/pubsub.provider';

@Module({
  imports: [CommonModule, DatabaseModule, StorageModule, TeamsModule],
  controllers: [ChatAttachmentsController],
  providers: [ChatsResolver, ChatsService, pubSubProvider],
  exports: [ChatsService],
})
export class ChatsModule {}
