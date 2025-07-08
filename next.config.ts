import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds to suppress any type errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript build errors to suppress any type errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
