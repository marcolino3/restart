import path from "node:path";
import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";
import { routing } from "@/i18n/rounting";

const backendUrl = process.env.BACKEND_URL || "http://localhost:4001";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  typescript: {
    // TODO: Fix pre-existing TS errors and remove this
    ignoreBuildErrors: true,
  },
  // Source-Maps in der Production-Build erzeugen, damit Sentry sie hochladen
  // kann. withSentryConfig löscht sie nach dem Upload aus dem Bundle, sodass
  // der Browser sie nicht aus dem Public-Bundle ziehen kann.
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.istockphoto.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      // PostHog Reverse-Proxy. Vermeidet AdBlocker, die `*.posthog.com`
      // routinemäßig blockieren, und erlaubt es uns, alle Tracking-Calls
      // unter unserer eigenen Domain als First-Party zu führen.
      // Sequenz wichtig: zuerst der statische Asset-Pfad, dann der Catch-All.
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // PostHog erwartet, dass / auf POST-Endpoints im rewrite-Pfad reagiert —
  // `skipTrailingSlashRedirect` verhindert 308-Redirects, die POSTs zu GETs
  // degradieren würden.
  skipTrailingSlashRedirect: true,
};

const withNextIntl = createNextIntlPlugin(routing);

// withSentryConfig: wickelt die Next-Config in den Sentry-Webpack-Plugin,
// der Source-Maps zu Sentry hochlädt (nur im Build mit SENTRY_AUTH_TOKEN gesetzt).
// Ohne SENTRY_AUTH_TOKEN: Sentry funktioniert weiter, nur ohne Source-Map-Resolution.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Source-Maps NICHT öffentlich exposen.
  hideSourceMaps: true,
  // Source-Maps nach Upload aus dem Bundle entfernen.
  widenClientFileUpload: true,

  // Logging des Plugins selbst — bei CI nur Errors.
  silent: !process.env.CI,

  // Tunneling: Sentry-Requests laufen über /monitoring/* statt sentry.io,
  // damit AdBlocker das nicht blockieren. Sentry mounted das automatisch.
  tunnelRoute: "/monitoring",

  disableLogger: true,
});
