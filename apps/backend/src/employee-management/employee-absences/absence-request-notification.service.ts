import { SmtpService } from '@/school-management/admissions/smtp.service';
import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AbsenceRecipientsService } from './absence-recipients.service';
import {
  absenceDecisionHtml,
  absenceDecisionSubject,
  absenceRequestHtml,
  absenceRequestSubject,
} from './templates/absence-request.template';

export interface AbsenceRequestNotificationInput {
  organizationId: string;
  employeeId: string;
  employeeName: string;
  categoryLabel: string;
  startDate: Date;
  endDate: Date;
  note?: string | null;
}

export interface AbsenceDecisionNotificationInput extends AbsenceRequestNotificationInput {
  approved: boolean;
  deciderName?: string | null;
  decisionNote?: string | null;
}

/**
 * Mails of the approval workflow: a new request goes to leadership (same
 * recipients as a sick report), the decision goes back to the employee.
 *
 * Delivery is best-effort and must run AFTER the transaction committed — a
 * mail outage never rolls back or fails a persisted absence.
 */
@Injectable()
export class AbsenceRequestNotificationService {
  private readonly logger = new Logger(AbsenceRequestNotificationService.name);

  constructor(
    private readonly smtp: SmtpService,
    private readonly recipients: AbsenceRecipientsService,
  ) {}

  async notifyRequested(input: AbsenceRequestNotificationInput): Promise<void> {
    const data = {
      employeeName: input.employeeName,
      categoryLabel: input.categoryLabel,
      startDate: formatDate(input.startDate),
      endDate: formatDate(input.endDate),
      note: input.note ?? null,
    };
    let recipients: Array<{ email: string; name?: string | null }>;
    try {
      recipients = await this.recipients.resolveRecipients(input);
    } catch (error) {
      this.logger.warn(
        `Could not resolve absence-request recipients for employee ${input.employeeId}: ${toMessage(error)}`,
      );
      return;
    }
    if (recipients.length === 0) {
      this.logger.warn(
        `No absence-request recipients configured for organization ${input.organizationId}`,
      );
      return;
    }
    await this.sendAll(
      input.organizationId,
      recipients,
      absenceRequestSubject(data),
      absenceRequestHtml(data),
    );
  }

  async notifyDecided(input: AbsenceDecisionNotificationInput): Promise<void> {
    const data = {
      employeeName: input.employeeName,
      categoryLabel: input.categoryLabel,
      startDate: formatDate(input.startDate),
      endDate: formatDate(input.endDate),
      note: input.note ?? null,
      approved: input.approved,
      deciderName: input.deciderName ?? null,
      decisionNote: input.decisionNote ?? null,
    };
    let emails: string[];
    try {
      emails = await this.recipients.findEmployeeEmails(
        input.organizationId,
        input.employeeId,
      );
    } catch (error) {
      this.logger.warn(
        `Could not resolve e-mails of employee ${input.employeeId}: ${toMessage(error)}`,
      );
      return;
    }
    if (emails.length === 0) return;
    await this.sendAll(
      input.organizationId,
      emails.map((email) => ({ email, name: input.employeeName })),
      absenceDecisionSubject(data),
      absenceDecisionHtml(data),
    );
  }

  private async sendAll(
    organizationId: string,
    recipients: Array<{ email: string; name?: string | null }>,
    subject: string,
    html: string,
  ): Promise<void> {
    for (const recipient of recipients) {
      try {
        await this.smtp.send({
          organizationId,
          to: recipient.email,
          toName: recipient.name,
          subject,
          html,
        });
      } catch (error) {
        this.logger.warn(
          `Absence mail to ${recipient.email} failed: ${toMessage(error)}`,
        );
      }
    }
  }
}

function formatDate(date: Date): string {
  return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat('dd.MM.yyyy');
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
