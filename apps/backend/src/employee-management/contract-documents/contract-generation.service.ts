import { Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';
import sharp from 'sharp';

import { sanitizeRichHtml } from '@/common/util/sanitize-rich-html';
import { StorageService } from '@/storage/storage.service';

// pdfmake 0.3 ist ein CJS-Singleton ohne brauchbare Typen für den Server-Pfad;
// html-to-pdfmake und jsdom werden nur hier gebraucht.
/* eslint-disable @typescript-eslint/no-require-imports */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pdfmake = require('pdfmake');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const helveticaContainer = require('pdfmake/standard-fonts/Helvetica');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const htmlToPdfmake = require('html-to-pdfmake');
/* eslint-enable @typescript-eslint/no-require-imports */

const STANDARD_FONT_FILES = new Set([
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
]);

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
pdfmake.setFonts(helveticaContainer);
// Nur die eingebetteten Standard-Fonts; keine sonstigen FS-/URL-Zugriffe.
pdfmake.setLocalAccessPolicy((path: string) => STANDARD_FONT_FILES.has(path));
pdfmake.setUrlAccessPolicy(() => false);
/* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

export interface ContractDocumentInput {
  bodyHtml: string;
  headerHtml?: string | null;
  footerHtml?: string | null;
  /** Data-URL (PNG) of the organization logo, or null. */
  logoDataUrl?: string | null;
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

@Injectable()
export class ContractGenerationService {
  private readonly logger = new Logger(ContractGenerationService.name);

  constructor(private readonly storage: StorageService) {}

  /**
   * Loads the org logo from storage and converts it to a PNG data-URL
   * (pdfmake cannot embed the stored webp). Returns null when the org has no
   * logo or it cannot be read — the document is then generated without it.
   */
  async loadLogoDataUrl(
    logoUrl: string | null | undefined,
  ): Promise<string | null> {
    if (!logoUrl) return null;
    // Logo URLs point at the public asset proxy (/api/uploads/<entity>/<file>
    // or /<entity>/<file>); the storage key is uploads/<entity>/<file>.
    const segments = logoUrl.split('/').filter(Boolean);
    if (segments.length < 2) return null;
    const entity = segments[segments.length - 2].replace(/[^a-zA-Z0-9_-]/g, '');
    const file = segments[segments.length - 1].replace(/[^a-zA-Z0-9._-]/g, '');
    if (!entity || !file) return null;
    try {
      const { stream } = await this.storage.getStream(
        `uploads/${entity}/${file}`,
      );
      const webp = await streamToBuffer(stream);
      const png = await sharp(webp).png().toBuffer();
      return `data:image/png;base64,${png.toString('base64')}`;
    } catch (error) {
      this.logger.warn(
        `Org logo ${logoUrl} could not be embedded: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  /**
   * Converts sanitized HTML into pdfmake content via a jsdom window. jsdom
   * (and html-to-docx below) are required lazily: their dependency chains ship
   * ESM files that Jest's CJS transform cannot parse at module load time.
   */
  private htmlContent(html: string): unknown {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { JSDOM } = require('jsdom') as typeof import('jsdom');
    /* eslint-enable @typescript-eslint/no-require-imports */
    const { window } = new JSDOM('');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return htmlToPdfmake(sanitizeRichHtml(html), { window });
  }

  async generatePdf(input: ContractDocumentInput): Promise<Buffer> {
    const hasHeader = Boolean(input.headerHtml) || Boolean(input.logoDataUrl);
    const hasFooter = Boolean(input.footerHtml);

    const headerStack: unknown[] = [];
    if (input.logoDataUrl) {
      headerStack.push({
        image: input.logoDataUrl,
        fit: [140, 40],
        margin: [0, 0, 0, 6],
      });
    }
    if (input.headerHtml) {
      headerStack.push(this.htmlContent(input.headerHtml));
    }

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [50, hasHeader ? 110 : 60, 50, hasFooter ? 70 : 50] as [
        number,
        number,
        number,
        number,
      ],
      defaultStyle: { font: 'Helvetica', fontSize: 10, lineHeight: 1.25 },
      ...(hasHeader
        ? {
            header: () => ({
              stack: headerStack,
              margin: [50, 24, 50, 0],
            }),
          }
        : {}),
      ...(hasFooter
        ? {
            footer: () => ({
              stack: [this.htmlContent(input.footerHtml as string)],
              fontSize: 8,
              color: '#555555',
              margin: [50, 8, 50, 0],
            }),
          }
        : {}),
      content: this.htmlContent(input.bodyHtml),
    };

    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
    const doc = pdfmake.createPdf(docDefinition);
    const buffer: Buffer = await doc.getBuffer();
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
    return buffer;
  }

  async generateDocx(input: ContractDocumentInput): Promise<Buffer> {
    const logoImg = input.logoDataUrl
      ? `<img src="${input.logoDataUrl}" width="140" />`
      : '';
    const headerHtml =
      input.headerHtml || logoImg
        ? `${logoImg}${input.headerHtml ? sanitizeRichHtml(input.headerHtml) : ''}`
        : undefined;
    const footerHtml = input.footerHtml
      ? sanitizeRichHtml(input.footerHtml)
      : undefined;

    /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    const htmlToDocx =
      require('html-to-docx').default ?? require('html-to-docx');
    const result = await htmlToDocx(
      sanitizeRichHtml(input.bodyHtml),
      headerHtml ?? null,
      {
        orientation: 'portrait',
        header: Boolean(headerHtml),
        footer: Boolean(footerHtml),
        margins: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
      },
      footerHtml ?? null,
    );
    /* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    return Buffer.isBuffer(result)
      ? result
      : Buffer.from(result as ArrayBuffer);
  }
}
