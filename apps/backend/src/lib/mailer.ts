// Standalone nodemailer transport for better-auth callbacks (magic-link).
// Kept separate from the Nest MailService because better-auth's plugin
// callbacks run outside the Nest DI container.
import * as nodemailer from 'nodemailer';

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.SMTP_USER ?? '',
      clientId: process.env.GOOGLE_AUTH_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET ?? '',
      refreshToken: process.env.GOOGLE_MAIL_REFRESH_TOKEN ?? '',
    },
  });
  return cachedTransporter;
}

export const mailer = {
  sendMagicLink: async (to: string, magicLinkUrl: string): Promise<void> => {
    if (process.env.NODE_ENV === 'test') return;
    await getTransporter().sendMail({
      from: process.env.SMTP_USER ?? '',
      to,
      subject: 'Dein Login-Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2>Hallo,</h2>
          <p>Klicke auf den Button, um dich einzuloggen:</p>
          <a href="${magicLinkUrl}"
             style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Jetzt einloggen
          </a>
          <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
            Dieser Link ist 15 Minuten gültig. Wenn du dich nicht einloggen wolltest, kannst du diese E-Mail ignorieren.
          </p>
        </div>
      `,
    });
  },
};
