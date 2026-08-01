import path from "node:path";
import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const backendUrl = process.env.BACKEND_URL || "http://localhost:4001";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
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
