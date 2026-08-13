export interface SickLeaveNotificationData {
  employeeName: string;
  /** `DD.MM.YYYY` */
  startDate: string;
  /** `DD.MM.YYYY`; equal to `startDate` for a single day. */
  endDate: string;
  /** `HH:mm` when the employee fell ill mid-day, otherwise null. */
  startTime?: string | null;
  comment?: string | null;
  isExtension: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sickLeaveNotificationSubject(
  data: SickLeaveNotificationData,
): string {
  const prefix = data.isExtension ? 'Krankmeldung verlängert' : 'Krankmeldung';
  const range =
    data.startDate === data.endDate
      ? data.startDate
      : `${data.startDate}–${data.endDate}`;
  return `${prefix}: ${data.employeeName} (${range})`;
}

/**
 * Plain, inline-styled HTML — mail clients strip stylesheets, so the markup
 * stays intentionally simple. All interpolated values are escaped because the
 * comment is free-text employee input.
 */
export function sickLeaveNotificationHtml(
  data: SickLeaveNotificationData,
): string {
  const name = escapeHtml(data.employeeName);
  const range =
    data.startDate === data.endDate
      ? escapeHtml(data.startDate)
      : `${escapeHtml(data.startDate)} bis ${escapeHtml(data.endDate)}`;

  const rows: string[] = [row('Mitarbeiter/in', name), row('Zeitraum', range)];
  if (data.startTime) {
    rows.push(row('Krank ab', `${escapeHtml(data.startTime)} Uhr`));
  }
  if (data.comment) {
    rows.push(row('Kommentar', escapeHtml(data.comment)));
  }

  const headline = data.isExtension
    ? 'Krankmeldung verlängert'
    : 'Neue Krankmeldung';

  return `<!DOCTYPE html>
<html lang="de">
  <body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:24px;">
      <h1 style="margin:0 0 16px;font-size:18px;">${headline}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows.join('\n        ')}
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#666;">
        Diese Nachricht wurde automatisch durch die Selbstmeldung der
        mitarbeitenden Person ausgelöst.
      </p>
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
