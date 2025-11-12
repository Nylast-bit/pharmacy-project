/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '216.245.184.30',
        port: '', // Puerto 80, así que déjalo vacío
        pathname: '/uploads/**', // Permite cualquier imagen dentro de /uploads/
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig