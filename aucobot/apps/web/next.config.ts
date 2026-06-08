import { loadMonorepoEnv } from "../../scripts/load-monorepo-env.mjs";
import type { NextConfig } from "next";
import { getServerApiBaseUrl } from "./lib/api-base-url";

loadMonorepoEnv();

const nextConfig: NextConfig = {
  transpilePackages: ["@aucobot/workspace-sync"],
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
