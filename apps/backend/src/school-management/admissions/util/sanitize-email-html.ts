import sanitizeHtml from 'sanitize-html';

/**
 * Allowlist sanitizer for email bodies produced by the rich-text editor.
 * Runs before an email is stored/sent so neither outbound recipients nor our
 * own email-history view (which renders the stored HTML) can be hit by script
 * injection. Kept deliberately narrow to formatting tags an email needs.
 */
export function sanitizeEmailHtml(dirty: string): string {
  return sanitizeHtml(dirty ?? '', {
    allowedTags: [
      'p',
      'br',
      'b',
      'strong',
      'i',
      'em',
      'u',
      's',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'h1',
      'h2',
      'h3',
      'h4',
      'span',
      'div',
      'hr',
      'pre',
      'code',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      span: ['style'],
      div: ['style'],
      p: ['style'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    // Force safe link behaviour on anything that survives.
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
      }),
    },
    // Drop only style props that could be used for exfiltration/clickjacking.
    allowedStyles: {
      '*': {
        color: [/^#[0-9a-f]{3,6}$/i, /^rgb\(/i],
        'text-align': [/^(left|right|center|justify)$/],
        'font-weight': [/^(normal|bold|[1-9]00)$/],
        'font-style': [/^(normal|italic)$/],
        'text-decoration': [/^(none|underline|line-through)$/],
      },
    },
  });
}
