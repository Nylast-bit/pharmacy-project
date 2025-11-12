/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http', // NOTA: Cambia esto a 'https' después de correr Certbot
        hostname: 'rxsolutionmeds.com',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http', // NOTA: Cambia esto a 'https' después de correr Certbot
        hostname: 'www.rxsolutionmeds.com',
        port: '',
        pathname: '/uploads/**',
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