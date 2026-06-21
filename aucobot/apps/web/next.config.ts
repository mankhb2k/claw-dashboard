
import { loadMonorepoEnv } from "../../scripts/load-monorepo-env.mjs";
import { getServerApiBaseUrl } from "./lib/http/api-base-url";

import type { NextConfig } from "next";

loadMonorepoEnv();

const nextConfig: NextConfig = {
  transpilePackages: ["@aucobot/workspace-sync"],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        pathname: "/gh/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/dashboard/info',
        destination: '/dashboard/setting',
        permanent: false,
      },
    ]
  },

  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${getServerApiBaseUrl()}/api/:path*`,
        },
      ],
    }
  },
};

export default nextConfig;
