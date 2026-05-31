import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadMonorepoEnv } from "../../scripts/load-monorepo-env.mjs";
import type { NextConfig } from "next";
import { getPublicApiBaseUrl, getServerApiBaseUrl } from "./lib/api-base-url";

loadMonorepoEnv();

const monorepoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

const nextConfig: NextConfig = {
  envDir: monorepoRoot,
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
