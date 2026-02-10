import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmployeeAbsence } from '../employee-management/employee-absences/entities/employee-absence.entity';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        clientId: this.configService.getOrThrow<string>(
          'GOOGLE_AUTH_CLIENT_ID',
        ),
        clientSecret: this.configService.getOrThrow<string>(
          'GOOGLE_AUTH_CLIENT_SECRET',
        ),
        refreshToken: this.configService.getOrThrow<string>(
          'GOOGLE_MAIL_REFRESH_TOKEN',
        ),
      },
    });
  }

  sendEmployeeAbsenceNoticeEmail(
    employeeAbsenceNotice: EmployeeAbsence,
    emails: string[],
  ) {
    console.log(employeeAbsenceNotice, emails);

    // await this.transporter.sendMail({
    //   from: this.configService.getOrThrow<string>('SMTP_USER'),
    //   to: email,
    //   subject: 'Test Mail',
    //   text: 'Hello Marco',
    // });
  }

  async sendMagicLinkEmail(
    to: string,
    firstName: string,
    magicLinkUrl: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.getOrThrow<string>('SMTP_USER'),
      to,
      subject: 'Dein Login-Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2>Hallo ${firstName},</h2>
          <p>Klicke auf den Button, um dich einzuloggen:</p>
          <a href="${magicLinkUrl}"
             style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Jetzt einloggen
          </a>
          <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
            Der Link ist 15 Minuten gueltig. Falls du diesen Login nicht angefordert hast, kannst du diese Email ignorieren.
          </p>
        </div>
      `,
    });
  }
}
