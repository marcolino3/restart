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
}
