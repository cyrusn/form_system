/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: process.env.BASE_PATH || (process.env.NODE_ENV === 'production' ? '/forms' : ''),
  // Configure better-sqlite3 as an external module so webpack doesn't try to bundle it for the browser
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'better-sqlite3'];
    }
    return config;
  }
};

export default nextConfig;
