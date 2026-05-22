/** @type {import('next').NextConfig} */
const nextConfig = {
  // Default distDir (.next) — custom distDir breaks dynamic import chunks (/_next/undefined)
  transpilePackages: ["leaflet", "react-leaflet"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
