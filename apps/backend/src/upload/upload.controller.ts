import {
  Controller,
  Post,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

const UPLOAD_ROOT = path.join(process.cwd(), 'public');

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('entity') entity: string,
    @Query('id') id: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!entity || !id) throw new BadRequestException('entity and id required');

    // Sanitize
    const safeEntity = entity.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');

    const dir = path.join(UPLOAD_ROOT, safeEntity);
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${safeId}.webp`);

    await sharp(file.buffer).webp({ quality: 80 }).toFile(filePath);

    return {
      url: `/${safeEntity}/${safeId}.webp`,
    };
  }

  @Delete()
  async remove(@Query('entity') entity: string, @Query('id') id: string) {
    if (!entity || !id) throw new BadRequestException('entity and id required');

    const safeEntity = entity.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');

    const filePath = path.join(UPLOAD_ROOT, safeEntity, `${safeId}.webp`);

    try {
      await fs.unlink(filePath);
    } catch {
      // File doesn't exist — that's fine
    }

    return { success: true };
  }
}
