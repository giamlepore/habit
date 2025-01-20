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
    }
  ],
  fallbacks: {
    document: '/offline'
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
        ],
      },
    ]
  },
}

module.exports = withPWA(nextConfig) 