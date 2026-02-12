/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  webpack: (config) => {
    // Prevent pdfjs-dist from trying to load node canvas
    config.resolve.alias.canvas = false;
    return config;
  },
}
module.exports = nextConfig
