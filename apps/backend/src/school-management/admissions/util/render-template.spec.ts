import { renderTemplate } from './render-template';

describe('renderTemplate', () => {
  it('substitutes known placeholders', () => {
    const out = renderTemplate('Hallo {{childFirstName}} {{childLastName}}', {
      childFirstName: 'Mia',
      childLastName: 'Muster',
    });
    expect(out).toBe('Hallo Mia Muster');
  });

  it('is case-insensitive and tolerates whitespace', () => {
    const out = renderTemplate('Liebe {{ RecipientName }}', {
      recipientName: 'Familie Muster',
    });
    expect(out).toBe('Liebe Familie Muster');
  });

  it('replaces unknown tokens with empty string (no raw token leaks)', () => {
    const out = renderTemplate('Stufe: {{unknownVar}}!', {
      childFirstName: 'Mia',
    });
    expect(out).toBe('Stufe: !');
  });

  it('replaces known-but-empty variables with empty string', () => {
    const out = renderTemplate('Klasse: {{desiredSchoolClass}}', {
      desiredSchoolClass: null,
    });
    expect(out).toBe('Klasse: ');
  });

  it('handles multiple occurrences of the same token', () => {
    const out = renderTemplate('{{orgName}} - {{orgName}}', {
      orgName: 'Colibri',
    });
    expect(out).toBe('Colibri - Colibri');
  });

  it('returns the input unchanged when empty', () => {
    expect(renderTemplate('', { childFirstName: 'Mia' })).toBe('');
  });
});
