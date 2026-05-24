import type { NextConfig } from "next";
import { getPublicApiBaseUrl, getServerApiBaseUrl } from "./lib/api-base-url";

const nextConfig: NextConfig = {
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
