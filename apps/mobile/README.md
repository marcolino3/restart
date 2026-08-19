# @restart/mobile

Expo-App für iOS und Android, die zusätzlich als PWA ins Web exportiert wird.

## Native

```bash
pnpm --filter @restart/mobile dev     # Expo Dev Server
pnpm --filter @restart/mobile ios     # iOS Simulator
pnpm --filter @restart/mobile android # Android Emulator
```

## Web / PWA

```bash
pnpm --filter @restart/mobile build:web   # statischer Export nach dist/
pnpm --filter @restart/mobile serve:web   # dist/ ausliefern
```

`expo export -p web` schreibt nach `dist/`; alles unter `public/` (Manifest,
Icons) wird dabei unverändert übernommen.

### Backend-Origin freischalten

Die PWA läuft auf einem anderen Port als die API, und der Login schickt die
Session als Cookie. Cookies ignorieren den Port — `localhost:4002` und
`localhost:4001` teilen sich den Cookie-Jar — aber CORS tut das nicht. Die
Origin, unter der die PWA ausgeliefert wird, muss deshalb in
`ALLOWED_ORIGINS` des Backends stehen; die Variable speist sowohl `enableCors`
als auch better-auths `trustedOrigins`:

```bash
ALLOWED_ORIGINS=http://localhost:4000,http://localhost:4002
```

Ohne den Eintrag antwortet der Preflight ohne `Access-Control-Allow-Origin`
und der Browser bricht jeden Login-Request ab. Für Produktion gehört die
PWA-Subdomain in dieselbe Liste.

Der Google-OAuth-Redirect landet auf dem Backend
(`/api/auth/callback/google`) und kehrt von dort zur `callbackURL` zurück —
auch dafür muss die Origin vertraut sein.

## Plattform-Splits

Metro löst `*.web.ts(x)` im Web-Bundle vor der generischen Datei auf. Genutzt
für alles, was auf beiden Seiten gegensätzlich funktioniert:

| Datei | Native | Web |
|---|---|---|
| `lib/auth-client.ts` | better-auth mit `expoClient`, Session in SecureStore | ohne Plugin, Session im httpOnly-Cookie |
| `lib/auth-headers.ts` | Cookie-Header von Hand, `credentials: "omit"` | keine Header, `credentials: "include"` |
| `app/login.tsx` | E-Mail, Google, Apple | E-Mail, Google (Apple ist native-only) |

Der Session-Token wird auf Web bewusst nirgends von JavaScript angefasst — das
Cookie ist httpOnly, und `Cookie` ist ohnehin ein für `fetch` verbotener
Header.
