import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { DatabaseModule } from '@/database/database.module';
import { ChatsService } from './chats.service';
import { ChatsResolver } from './chats.resolver';
import { pubSubProvider } from './pubsub/pubsub.provider';

@Module({
  imports: [CommonModule, DatabaseModule],
  providers: [ChatsResolver, ChatsService, pubSubProvider],
  exports: [ChatsService],
})
export class ChatsModule {}
