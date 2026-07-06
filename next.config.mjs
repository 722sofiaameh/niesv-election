/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep fewer compiled pages in memory during dev to reduce stale chunk issues.
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid corrupted webpack disk cache causing missing CSS/JS in dev.
      config.cache = false;
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
