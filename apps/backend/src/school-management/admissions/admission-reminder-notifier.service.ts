import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IsNull, LessThanOrEqual, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AdmissionReminder } from './entities/admission-reminder.entity';
import { SmtpService } from './smtp.service';

/**
 * Daily notifier for admission reminders. Once a reminder becomes due
 * (`dueAt <= now`, not completed, not yet notified) the assignee is emailed a
 * single reminder message. `notifiedAt` is stamped on success so an overdue
 * reminder is never re-mailed on subsequent days.
 *
 * Per-org isolation and error handling mirror the nightly time-tracking
 * reconcile cron: one failing org/reminder must not block the rest.
 */
@Injectable()
export class AdmissionReminderNotifierService {
  private readonly logger = new Logger(AdmissionReminderNotifierService.name);

  constructor(
    @InjectRepository(AdmissionReminder)
    private readonly repo: Repository<AdmissionReminder>,
    private readonly smtp: SmtpService,
  ) {}

  @Cron('0 7 * * *', { timeZone: 'Europe/Zurich' })
  async notifyDueReminders(): Promise<void> {
    const started = Date.now();
    const now = new Date();
    // Assignee + user + primary email are needed to address the mail; the
    // application supplies the child's name for the subject/body.
    const due = await this.repo.find({
      where: {
        completedAt: IsNull(),
        notifiedAt: IsNull(),
        dueAt: LessThanOrEqual(now),
        assignedToMembershipId: Not(IsNull()),
      },
      relations: [
        'application',
        'assignedToMembership',
        'assignedToMembership.user',
        'assignedToMembership.user.userEmails',
      ],
      order: { dueAt: 'ASC' },
      take: 500,
    });

    let sent = 0;
    for (const reminder of due) {
      try {
        const notified = await this.notifyOne(reminder, now);
        if (notified) sent += 1;
      } catch (err) {
        // A single failing reminder must not block the others. The reminder
        // stays unnotified and is retried on the next run.
        this.logger.error(
          `Reminder ${reminder.id} notification failed: ${String(err)}`,
        );
      }
    }

    this.logger.log(
      `Admission reminder notifier: ${sent}/${due.length} sent in ${
        Date.now() - started
      }ms`,
    );
  }

  /**
   * Send one reminder email and stamp `notifiedAt`. Returns false (without
   * stamping) when there is no deliverable recipient or the org has no SMTP
   * configured, so the reminder is retried once its setup is complete.
   */
  private async notifyOne(
    reminder: AdmissionReminder,
    now: Date,
  ): Promise<boolean> {
    const user = reminder.assignedToMembership?.user;
    const emails = user?.userEmails ?? [];
    const primary =
      emails.find((e) => e.isPrimary && e.email?.trim()) ??
      emails.find((e) => e.email?.trim());
    const to = primary?.email?.trim();
    if (!to) return false;

    if (!(await this.smtp.isConfigured(reminder.organizationId))) {
      return false;
    }

    const recipientName = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    await this.smtp.send({
      organizationId: reminder.organizationId,
      to,
      toName: recipientName || null,
      subject: this.buildSubject(reminder),
      html: this.buildHtml(reminder, recipientName),
    });

    reminder.notifiedAt = now;
    await this.repo.save(reminder);
    return true;
  }

  private childName(reminder: AdmissionReminder): string {
    const app = reminder.application;
    if (!app) return '';
    return [app.childFirstName, app.childLastName]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private buildSubject(reminder: AdmissionReminder): string {
    const child = this.childName(reminder);
    return child
      ? `Erinnerung fällig: ${reminder.title} (${child})`
      : `Erinnerung fällig: ${reminder.title}`;
  }

  private buildHtml(
    reminder: AdmissionReminder,
    recipientName: string,
  ): string {
    const child = this.childName(reminder);
    const greeting = recipientName
      ? `Hallo ${escapeHtml(recipientName)},`
      : 'Hallo,';
    const due = reminder.dueAt.toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Zurich',
    });
    const noteBlock = reminder.note
      ? `<p style="margin:0 0 12px;color:#475569">${escapeHtml(
          reminder.note,
        )}</p>`
      : '';
    const childBlock = child
      ? `<p style="margin:0 0 4px"><strong>Bewerbung:</strong> ${escapeHtml(
          child,
        )}</p>`
      : '';
    return `
      <div style="font-family:sans-serif;font-size:14px;color:#0f172a;line-height:1.5">
        <p style="margin:0 0 12px">${greeting}</p>
        <p style="margin:0 0 12px">
          Eine Erinnerung im Aufnahmeprozess ist fällig:
        </p>
        <p style="margin:0 0 4px"><strong>${escapeHtml(reminder.title)}</strong></p>
        ${childBlock}
        <p style="margin:0 0 12px"><strong>Fällig am:</strong> ${due}</p>
        ${noteBlock}
        <p style="margin:0;color:#64748b">
          Diese E-Mail wurde automatisch versendet.
        </p>
      </div>
    `.trim();
  }
}

/** Minimal HTML escaping for user-controlled reminder fields in the email body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
