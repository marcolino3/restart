import { createRequire } from "node:module";
import path from "node:path";
import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const backendUrl = process.env.BACKEND_URL || "http://localhost:4001";

const workspaceRoot = path.join(__dirname, "../../");

// next resolves @swc/helpers through dist/server/require-hook.js via the
// "module-sync" export condition, which points at esm/. The static file trace
// only follows the "default" (cjs) branch, so the standalone bundle shipped
// cjs/ alone and the server died on start with
//   Cannot find module '.../@swc/helpers/esm/_interop_require_default.js'
// A full-workspace build hides this: node then falls back to the workspace
// node_modules sitting next to .next/standalone. The container image is built
// from a `turbo prune` tree where the bundle is all there is, so it crashes.
//
// Resolve the directory instead of hard-coding the version: the path carries
// the @swc/helpers version pnpm picked for this next release, and pinning it
// would silently stop matching on the next bump and bring the crash back.
const swcHelpersEsm = (() => {
  try {
    const pkg = createRequire(require.resolve("next/package.json")).resolve(
      "@swc/helpers/package.json",
    );
    return [`${path.relative(__dirname, path.join(path.dirname(pkg), "esm"))}/**`];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: workspaceRoot,
  outputFileTracingIncludes: {
    "**": swcHelpersEsm,
  },
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
    ];
  },
  // Security-Header bewusst hier statt im Ingress: moderne nginx-ingress
  // Controller lehnen die 'configuration-snippet'-Annotation per Admission-
  // Webhook ab (Snippets erlauben beliebige nginx-Config-Injection —
  // CVE-2021-25742). Sie clusterweit wieder freizuschalten wäre ein
  // schlechter Tausch für einen Header-Block.
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
      },
    ];

    // HSTS nur über HTTPS ausliefern. Lokal läuft die App über HTTP; ein
    // hier gesetzter Header würde im Browser eine HTTPS-Pflicht für
    // localhost cachen, die sich nur manuell wieder löschen lässt.
    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }

    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
