import { SmtpService } from '@/school-management/admissions/smtp.service';
import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import {
  AbsenceRecipient,
  AbsenceRecipientsService,
} from '../employee-absences/absence-recipients.service';
import {
  sickLeaveNotificationHtml,
  sickLeaveNotificationSubject,
} from './templates/sick-leave-notification.template';

export interface SickLeaveNotificationInput {
  organizationId: string;
  /** Employee reporting sick — excluded from the recipient list. */
  employeeId: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  startTime?: string | null;
  comment?: string | null;
  /** True when an existing absence was extended rather than newly created. */
  isExtension: boolean;
}

export type SickLeaveRecipient = AbsenceRecipient;

/**
 * Notifies leadership about a self-reported sick leave.
 *
 * Delivery is best-effort: a failing mail server must never roll back an
 * absence that is already persisted, so every error is logged and swallowed.
 * Call only AFTER the absence transaction has committed.
 */
@Injectable()
export class SickLeaveNotificationService {
  private readonly logger = new Logger(SickLeaveNotificationService.name);

  constructor(
    private readonly smtp: SmtpService,
    private readonly recipientsService: AbsenceRecipientsService,
  ) {}

  async notify(input: SickLeaveNotificationInput): Promise<void> {
    let recipients: SickLeaveRecipient[];
    try {
      recipients = await this.resolveRecipients(input);
    } catch (error) {
      this.logger.warn(
        `Could not resolve sick-leave recipients for employee ${input.employeeId}: ${toMessage(error)}`,
      );
      return;
    }

    if (recipients.length === 0) {
      this.logger.warn(
        `No sick-leave recipients configured for organization ${input.organizationId}`,
      );
      return;
    }

    const data = {
      employeeName: input.employeeName,
      startDate: formatDate(input.startDate),
      endDate: formatDate(input.endDate),
      startTime: input.startTime ? formatTime(input.startTime) : null,
      comment: input.comment ?? null,
      isExtension: input.isExtension,
    };
    const subject = sickLeaveNotificationSubject(data);
    const html = sickLeaveNotificationHtml(data);

    // Sequential on purpose: a shared SMTP relay is happier with a few serial
    // messages than with a burst, and the recipient count is small.
    for (const recipient of recipients) {
      try {
        await this.smtp.send({
          organizationId: input.organizationId,
          to: recipient.email,
          toName: recipient.name,
          subject,
          html,
        });
      } catch (error) {
        this.logger.warn(
          `Sick-leave mail to ${recipient.email} failed: ${toMessage(error)}`,
        );
      }
    }
  }

  /** Delegates to the shared recipient resolution (see `AbsenceRecipientsService`). */
  async resolveRecipients(
    input: Pick<SickLeaveNotificationInput, 'organizationId' | 'employeeId'>,
  ): Promise<SickLeaveRecipient[]> {
    return this.recipientsService.resolveRecipients(input);
  }
}
/** Absence dates are stored as UTC midnight — read them back in UTC. */
function formatDate(date: Date): string {
  return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat('dd.MM.yyyy');
}

function formatTime(value: string): string {
  const match = /^(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : value;
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
