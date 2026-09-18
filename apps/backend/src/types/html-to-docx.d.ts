declare module 'html-to-docx' {
  /**
   * Renders an HTML string into a DOCX buffer.
   * https://github.com/privateOmega/html-to-docx
   */
  export default function htmlToDocx(
    htmlString: string,
    headerHTMLString?: string | null,
    documentOptions?: Record<string, unknown>,
    footerHTMLString?: string | null,
  ): Promise<Buffer | ArrayBuffer | Blob>;
}
