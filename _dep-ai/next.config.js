/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'dist', // Change from 'out' to 'dist' to avoid conflicts
  images: {
    unoptimized: true
  },
  // Disable server-side features completely
  poweredByHeader: false,
  reactStrictMode: true
}

module.exports = nextConfig