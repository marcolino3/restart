import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { routing } from "@/i18n/rounting";

const backendUrl = process.env.BACKEND_URL || "http://localhost:4001";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // TODO: Fix pre-existing TS errors and remove this
    ignoreBuildErrors: true,
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
};

const withNextIntl = createNextIntlPlugin(routing);
export default withNextIntl(nextConfig);
