import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { createReadStream } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';

/**
 * Object storage abstraction for all uploads (avatars, org logos, contract
 * PDFs). Backed by an S3-compatible bucket (Infomaniak Object Storage, Swiss —
 * DSGVO, no US vendor) when configured via env, otherwise a local
 * `private-uploads/` directory so dev/CI work without a bucket.
 *
 * Access control is NOT handled here — it lives at the route level: public
 * assets are proxied unauthenticated via /api/uploads, contract PDFs only via
 * the authenticated, org-scoped ContractDocumentsController.
 *
 * Required env for S3: S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
 * S3_ENDPOINT (provider URL). Optional: S3_REGION, S3_FORCE_PATH_STYLE.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3?: S3Client;
  private readonly bucket?: string;
  private readonly localRoot = path.join(process.cwd(), 'private-uploads');

  constructor() {
    const bucket = process.env.S3_BUCKET;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    if (bucket && accessKeyId && secretAccessKey) {
      this.bucket = bucket;
      this.s3 = new S3Client({
        // For S3-COMPATIBLE providers the data location is determined by the
        // endpoint (Infomaniak = Switzerland), NOT by this region label — it
        // is just a required-but-cosmetic value for the SDK. Set S3_REGION to
        // whatever Infomaniak specifies for your bucket; the placeholder does
        // not send data anywhere.
        region: process.env.S3_REGION ?? 'ch-dk-2',
        endpoint: process.env.S3_ENDPOINT || undefined,
        // Most S3-compatible providers (incl. Infomaniak) need path-style.
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log(`Object storage: S3 bucket "${bucket}"`);
    } else {
      this.logger.log(
        `Object storage: local filesystem (${this.localRoot}) — set S3_* env for production`,
      );
    }
  }

  /** Local absolute path for a key, refusing any path traversal. */
  private localPath(key: string): string {
    const safe = key
      .split('/')
      .map((s) => s.replace(/[^a-zA-Z0-9._-]/g, ''))
      // Drop empty and traversal segments ("." / "..") so untrusted keys can
      // never climb out of the storage root — the boundary check below is the
      // second line of defence.
      .filter((s) => s && s !== '.' && s !== '..')
      .join('/');
    const resolved = path.resolve(this.localRoot, safe);
    if (
      resolved !== this.localRoot &&
      !resolved.startsWith(this.localRoot + path.sep)
    ) {
      throw new Error('Resolved storage path escapes the root');
    }
    return resolved;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    if (this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      return;
    }
    const filePath = this.localPath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body);
  }

  /** Returns a readable stream for the object. Throws if it doesn't exist. */
  async getStream(
    key: string,
  ): Promise<{ stream: Readable; contentType?: string }> {
    if (this.s3) {
      const res = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return { stream: res.Body as Readable, contentType: res.ContentType };
    }
    const filePath = this.localPath(key);
    await fs.access(filePath);
    return { stream: createReadStream(filePath) };
  }

  async delete(key: string): Promise<void> {
    if (this.s3) {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return;
    }
    try {
      await fs.unlink(this.localPath(key));
    } catch {
      // Already gone — fine.
    }
  }
}
