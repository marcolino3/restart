// The allowlist sanitizer moved to common/util so contract templates can
// share it; this alias keeps the email-flavoured name for existing callers.
export { sanitizeRichHtml as sanitizeEmailHtml } from '@/common/util/sanitize-rich-html';
