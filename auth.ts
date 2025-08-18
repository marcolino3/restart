import { google } from 'googleapis';
import * as readline from 'readline';
import * as fs from 'fs/promises';
import * as path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = path.resolve(__dirname, 'token.json');

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise<string>((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const clientId =
    '40708385679-g1m6nvaehjfsgkep4riovsr2gc7kqqdd.apps.googleusercontent.com';
  const clientSecret = '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';
  const redirectUri = 'http://localhost:3001/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error(
      'Bitte setze GOOGLE_OAUTH_CLIENT_ID und GOOGLE_OAUTH_CLIENT_SECRET in der .env Datei',
    );
  }

  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n🚀 Öffne diesen Link in deinem Browser:\n');
  console.log(authUrl);

  const code = await prompt('\n🔑 Code von Google hier einfügen: ');

  const { tokens } = await oAuth2Client.getToken(code.trim());
  oAuth2Client.setCredentials(tokens);

  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log(`\n✅ Token gespeichert in: ${TOKEN_PATH}`);
  console.log(`\n🔁 Refresh Token: ${tokens.refresh_token}`);
}

main().catch((err) => {
  console.error('❌ Fehler beim Authentifizieren:', err);
});
