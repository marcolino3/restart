/**
 * Structured issues for the curriculum import.
 *
 * Every error and warning the parser/plan builder produces carries a stable
 * `code` plus the parameters needed to render a localized message in the
 * frontend. `message` is an English fallback for logs and API clients that do
 * not translate.
 */
export type ImportIssueCode =
  | 'UNSUPPORTED_EXTENSION'
  | 'NO_SHEETS'
  | 'HEADER_NOT_FOUND'
  | 'NO_DATA_ROWS'
  | 'NO_MASTER_SHEET'
  | 'UNKNOWN_SHEET_NAME'
  | 'DUPLICATE_SHEET_LOCALE'
  | 'ROWS_WITHOUT_SEQUENCE'
  | 'DUPLICATE_SEQUENCE'
  | 'TRANSLATION_CONFLICT'
  | 'TRANSLATION_HIERARCHY_MISSING'
  | 'TRANSLATION_MISSING'
  | 'TRANSLATION_EXTRA_SEQUENCE';

export type ImportIssueParams = Record<string, string | number>;

export interface ImportIssue {
  code: ImportIssueCode;
  params: ImportIssueParams;
  message: string;
}

export function importIssue(
  code: ImportIssueCode,
  params: ImportIssueParams,
  message: string,
): ImportIssue {
  return { code, params, message };
}

export class CurriculumImportError extends Error {
  readonly code: ImportIssueCode;
  readonly params: ImportIssueParams;

  constructor(
    code: ImportIssueCode,
    params: ImportIssueParams,
    message: string,
  ) {
    super(message);
    this.name = 'CurriculumImportError';
    this.code = code;
    this.params = params;
  }

  toIssue(): ImportIssue {
    return importIssue(this.code, this.params, this.message);
  }
}
