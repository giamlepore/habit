const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development',
disable: false,
  buildExcludes: [
    /middleware-manifest\.json$/,
    /app-build-manifest\.json$/,
    /_next\/static\/development\/_buildManifest\.js$/,
  ],
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200
        }
      }
    },
    {
      urlPattern: /manifest\.json$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'manifest-cache'
      }
    }
  ],
  fallbacks: {
    document: '/offline',
    image: '/caracol.png'
  }
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  headers: async () => {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },
  staticPageGenerationTimeout: 120,
}

module.exports = withPWA(nextConfig) 