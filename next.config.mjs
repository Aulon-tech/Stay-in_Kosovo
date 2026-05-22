import { NEXT_DIST_DIR } from "./scripts/next-dist-path.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: NEXT_DIST_DIR,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
      // OneDrive/synced folders: avoid stale chunks → "reading 'call'" on /itinerary
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
