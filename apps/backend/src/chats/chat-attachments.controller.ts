import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { BetterAuthGuard } from '@/auth/guard/better-auth.guard';
import { TokenPayload } from '@/auth/interfaces/token-payload.interface';
import { StorageService } from '@/storage/storage.service';
import { PostgresPubSub } from 'graphql-pg-subscriptions';
import { ChatsService } from './chats.service';
import { MessageAttachment } from './entities/message-attachment.entity';
import { PUB_SUB } from './pubsub/pubsub.provider';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

/** Allowed MIME types → file extension for the object key. */
const ALLOWED: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const messageTopic = (conversationId: string) =>
  `messageAdded.${conversationId}`;

/**
 * Chat attachments: a file posted into a conversation. The upload creates a
 * message that carries the attachment and publishes it over the same
 * messageAdded topic as text messages, so it arrives in realtime. Stored in
 * object storage under an org-scoped key (`chat/<orgId>/<uuid>.<ext>`) and only
 * reachable via this authenticated controller keyed on the caller's active org
 * (multi-tenant isolation by construction — mirrors AdmissionDocuments).
 */
@Controller('chat-attachments')
@UseGuards(BetterAuthGuard)
export class ChatAttachmentsController {
  constructor(
    @InjectRepository(MessageAttachment)
    private readonly attachmentsRepo: Repository<MessageAttachment>,
    private readonly chatsService: ChatsService,
    private readonly storage: StorageService,
    @Inject(PUB_SUB) private readonly pubSub: PostgresPubSub,
  ) {}

  private key(orgId: string, fileId: string, ext: string): string {
    const safeOrg = orgId.replace(/[^a-zA-Z0-9-]/g, '');
    const safeFile = fileId.replace(/[^a-zA-Z0-9-]/g, '');
    const safeExt = ext.replace(/[^a-z0-9]/g, '');
    if (!safeOrg || !safeFile || !safeExt) {
      throw new BadRequestException('Invalid attachment reference');
    }
    return `chat/${safeOrg}/${safeFile}.${safeExt}`;
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('conversationId') conversationId: string,
    @CurrentUser() user: TokenPayload,
    @Query('body') body?: string,
  ): Promise<{ messageId: string }> {
    if (!file) throw new BadRequestException('No file provided');
    const ext = ALLOWED[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        'Only PDF, JPEG, PNG, WebP or GIF files are allowed',
      );
    }
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');
    if (!user.membershipId)
      throw new ForbiddenException('No active membership');
    if (!conversationId) {
      throw new BadRequestException('conversationId required');
    }

    // assertParticipant enforces that the caller belongs to the conversation
    // in their active org — the tenant + membership gate.
    await this.chatsService.assertParticipant(
      orgId,
      user.membershipId,
      conversationId,
    );

    const fileId = randomUUID();
    await this.storage.put(
      this.key(orgId, fileId, ext),
      file.buffer,
      file.mimetype,
    );

    const message = await this.chatsService.sendMessage(
      orgId,
      user.membershipId,
      conversationId,
      body ?? '',
      {
        fileId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    );

    await this.pubSub.publish(messageTopic(conversationId), {
      messageAdded: message,
    });

    return { messageId: message.id };
  }

  @Get(':id')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ): Promise<StreamableFile> {
    const orgId = user.orgId;
    if (!orgId) throw new ForbiddenException('No active organization');
    if (!user.membershipId)
      throw new ForbiddenException('No active membership');

    const att = await this.attachmentsRepo.findOne({
      where: { id, organizationId: orgId },
      relations: { message: true },
    });
    if (!att) throw new NotFoundException('Attachment not found');

    // The caller must be a participant of the attachment's conversation.
    await this.chatsService.assertParticipant(
      orgId,
      user.membershipId,
      att.message!.conversationId,
    );

    const ext = ALLOWED[att.mimeType] ?? 'bin';
    try {
      const { stream } = await this.storage.getStream(
        this.key(orgId, att.fileId, ext),
      );
      return new StreamableFile(stream, {
        type: att.mimeType,
        disposition: `inline; filename="${att.originalName.replace(/"/g, '')}"`,
      });
    } catch {
      throw new NotFoundException('Attachment not found');
    }
  }
}
