import { StorageService } from '@/storage/storage.service';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';

export const RECEIPT_MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export const RECEIPT_ALLOWED_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const FILE_ID_PATTERN = /^[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/;
const UUID_PATTERN = /^[0-9a-f-]{36}$/i;

/**
 * Private storage for expense receipts under
 * `expense-receipts/<orgId>/<schoolClassId>/<uuid>.<ext>`.
 *
 * The class id is part of the key on purpose: a file id alone never addresses
 * a receipt. Callers must first prove access to the class (see
 * ClassBudgetAccessService), so a receipt of class B is unreachable with a
 * file id even for a teacher of class A in the same org.
 */
@Injectable()
export class ExpenseReceiptsService {
  private readonly logger = new Logger(ExpenseReceiptsService.name);

  constructor(private readonly storage: StorageService) {}

  private key(orgId: string, schoolClassId: string, fileId: string): string {
    if (
      !UUID_PATTERN.test(orgId) ||
      !UUID_PATTERN.test(schoolClassId) ||
      !FILE_ID_PATTERN.test(fileId)
    ) {
      throw new BadRequestException('Invalid receipt reference');
    }
    return `expense-receipts/${orgId}/${schoolClassId}/${fileId}`;
  }

  mimeOf(fileId: string): string {
    const ext = fileId.split('.').pop()?.toLowerCase();
    const entry = Object.entries(RECEIPT_ALLOWED_MIME).find(
      ([, e]) => e === ext,
    );
    return entry?.[0] ?? 'application/octet-stream';
  }

  async put(
    orgId: string,
    schoolClassId: string,
    file: { buffer: Buffer; mimetype: string },
  ): Promise<string> {
    const ext = RECEIPT_ALLOWED_MIME[file.mimetype];
    if (!ext) {
      throw new BadRequestException(
        'Only PDF, JPEG, PNG or WebP receipts are allowed',
      );
    }
    const fileId = `${randomUUID()}.${ext}`;
    await this.storage.put(
      this.key(orgId, schoolClassId, fileId),
      file.buffer,
      file.mimetype,
    );
    return fileId;
  }

  async stream(
    orgId: string,
    schoolClassId: string,
    fileId: string,
  ): Promise<Readable> {
    const { stream } = await this.storage.getStream(
      this.key(orgId, schoolClassId, fileId),
    );
    return stream;
  }

  async read(
    orgId: string,
    schoolClassId: string,
    fileId: string,
  ): Promise<Buffer> {
    const stream = await this.stream(orgId, schoolClassId, fileId);
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer | string>) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  }

  async exists(
    orgId: string,
    schoolClassId: string,
    fileId: string,
  ): Promise<boolean> {
    try {
      const stream = await this.stream(orgId, schoolClassId, fileId);
      stream.destroy();
      return true;
    } catch {
      return false;
    }
  }

  async delete(
    orgId: string,
    schoolClassId: string,
    fileId: string,
  ): Promise<void> {
    await this.storage.delete(this.key(orgId, schoolClassId, fileId));
  }

  /** Best-effort cleanup after the owning expense is gone or re-pointed. */
  async deleteQuietly(
    orgId: string,
    schoolClassId: string,
    fileId: string,
  ): Promise<void> {
    try {
      await this.delete(orgId, schoolClassId, fileId);
    } catch (error) {
      this.logger.warn(
        `Could not delete receipt ${fileId}: ${(error as Error).message}`,
      );
    }
  }
}
