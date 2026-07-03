import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { StorageService } from './storage.service';

/**
 * Serves PUBLIC uploaded assets (avatars, org logos) — unauthenticated, same
 * as the previous static `public/` serving, but proxied from object storage so
 * the URL scheme (/api/uploads/<entity>/<file>) is unchanged for the frontend.
 * Contract PDFs are NOT reachable here (different key prefix + dedicated
 * authenticated controller).
 */
@Controller('uploads')
export class PublicAssetController {
  constructor(private readonly storage: StorageService) {}

  @Get(':entity/:filename')
  async serve(
    @Param('entity') entity: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const safeEntity = entity.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFile = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    const key = `uploads/${safeEntity}/${safeFile}`;
    try {
      const { stream, contentType } = await this.storage.getStream(key);
      res.setHeader('Content-Type', contentType ?? 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      stream.pipe(res);
    } catch {
      throw new NotFoundException('Asset not found');
    }
  }
}
