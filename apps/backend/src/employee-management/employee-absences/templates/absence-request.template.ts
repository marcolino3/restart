/**
 * Mails of the absence-request workflow. Plain, inline-styled HTML like the
 * sick-leave template — mail clients strip stylesheets. Every interpolated
 * value is escaped because notes are free-text user input.
 */

export interface AbsenceRequestMailData {
  employeeName: string;
  categoryLabel: string;
  /** `DD.MM.YYYY` */
  startDate: string;
  /** `DD.MM.YYYY`; equal to `startDate` for a single day. */
  endDate: string;
  note?: string | null;
}

export interface AbsenceDecisionMailData extends AbsenceRequestMailData {
  approved: boolean;
  deciderName?: string | null;
  decisionNote?: string | null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function range(data: { startDate: string; endDate: string }): string {
  return data.startDate === data.endDate
    ? data.startDate
    : `${data.startDate}–${data.endDate}`;
}

export function absenceRequestSubject(data: AbsenceRequestMailData): string {
  return `Absenzantrag: ${data.employeeName} – ${data.categoryLabel} (${range(data)})`;
}

export function absenceRequestHtml(data: AbsenceRequestMailData): string {
  const rows = [
    row('Mitarbeiter/in', escapeHtml(data.employeeName)),
    row('Kategorie', escapeHtml(data.categoryLabel)),
    row('Zeitraum', escapeHtml(range(data))),
  ];
  if (data.note) rows.push(row('Begründung', escapeHtml(data.note)));

  return layout(
    'Neuer Absenzantrag',
    rows,
    'Bitte den Antrag unter «Absenzanträge» genehmigen oder ablehnen.',
  );
}

export function absenceDecisionSubject(data: AbsenceDecisionMailData): string {
  const verdict = data.approved ? 'genehmigt' : 'abgelehnt';
  return `Absenzantrag ${verdict}: ${data.categoryLabel} (${range(data)})`;
}

export function absenceDecisionHtml(data: AbsenceDecisionMailData): string {
  const rows = [
    row('Kategorie', escapeHtml(data.categoryLabel)),
    row('Zeitraum', escapeHtml(range(data))),
    row('Entscheid', data.approved ? 'Genehmigt' : 'Abgelehnt'),
  ];
  if (data.deciderName) {
    rows.push(row('Entschieden von', escapeHtml(data.deciderName)));
  }
  if (data.decisionNote) {
    rows.push(row('Bemerkung', escapeHtml(data.decisionNote)));
  }

  return layout(
    data.approved ? 'Absenzantrag genehmigt' : 'Absenzantrag abgelehnt',
    rows,
    data.approved
      ? 'Die Absenz ist nun definitiv eingetragen.'
      : 'Der Antrag wurde nicht eingetragen. Bei Fragen wende dich an deine vorgesetzte Person.',
  );
}

function layout(headline: string, rows: string[], footer: string): string {
  return `<!DOCTYPE html>
<html lang="de">
  <body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;">
      <h1 style="margin:0 0 16px;font-size:18px;">${headline}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows.join('\n        ')}
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#666;">${footer}</p>
    </div>
  </body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
          <td style="padding:6px 12px 6px 0;color:#666;vertical-align:top;white-space:nowrap;">${label}</td>
          <td style="padding:6px 0;font-weight:600;">${value}</td>
        </tr>`;
}
