/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
      domains: ['d141j87w7m6c83.cloudfront.net', 'd3vdp1v54gz11l.cloudfront.net']
  }
}

module.exports = nextConfig
