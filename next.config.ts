import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { routing } from "@/i18n/rounting";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.istockphoto.com", // Ersetze mit deiner echten Domain
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*", // deine NestJS-API
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin(routing);
export default withNextIntl(nextConfig);
