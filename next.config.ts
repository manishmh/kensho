import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['next-auth'],
  serverExternalPackages: ['@prisma/client'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@prisma/client': '@prisma/client',
      });
    }
    return config;
  },
};

export default nextConfig;
