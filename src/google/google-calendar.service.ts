import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { DateTime } from 'luxon';

@Injectable()
export class GoogleCalendarService {
  private readonly oauth2Client: OAuth2Client;
  private readonly calendar: calendar_v3.Calendar;
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(private readonly config: ConfigService) {
    const clientId = this.config.getOrThrow<string>('GOOGLE_AUTH_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>(
      'GOOGLE_AUTH_CLIENT_SECRET',
    );
    const redirectUri =
      this.config.get<string>('GOOGLE_AUTH_REDIRECT_URI') ??
      'http://localhost:3000/oauth2callback';

    // 1. OAuth Client
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );

    // 2. Token setzen (wird leer sein, bis du ihn einträgst)
    const refreshToken = this.config.get<string>(
      'GOOGLE_CALENDAR_REFRESH_TOKEN',
    );
    if (refreshToken) {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    }

    // 3. Kalender initialisieren
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Nur einmal nötig: Ruft die URL ab, mit der du manuell die Berechtigung für Kalender geben kannst.
   */
  generateAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      // Alternativ: 'https://www.googleapis.com/auth/calendar' für alle Kalenderfunktionen
    ];

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // wichtig für refresh_token
    });

    this.logger.log(`Google OAuth URL: ${url}`);
    return url;
  }

  /**
   * Tauscht Code gegen Token (einmalig nach Login über die URL)
   */
  async exchangeCodeForToken(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);

    this.logger.log('Access Token:', tokens.access_token);
    this.logger.log('Refresh Token:', tokens.refresh_token); // <== Diesen in .env eintragen

    return tokens;
  }

  /**
   * Erstellt einen Kalendertermin
   */
  async createAbsenceEvent({
    summary,
    description,
    start,
    end,
    allDay = false,
  }: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    allDay: boolean;
  }): Promise<calendar_v3.Schema$Event> {
    const calendarId = this.config.getOrThrow<string>('GOOGLE_CALENDAR_ID');

    console.log(calendarId);

    const response = await this.calendar.events.insert({
      calendarId,
      requestBody: {
        summary,
        description,
        start: allDay
          ? { date: DateTime.fromJSDate(start).toISODate() }
          : { dateTime: start.toISOString(), timeZone: 'Europe/Zurich' },

        end: allDay
          ? { date: DateTime.fromJSDate(end).toISODate() }
          : { dateTime: end.toISOString(), timeZone: 'Europe/Zurich' },
        visibility: 'private',
      },
    });

    return response.data;
  }
}
