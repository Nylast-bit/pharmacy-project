/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https', // NOTA: Cambia esto a 'https' después de correr Certbot
        hostname: 'rxsolutionmeds.com',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https', // NOTA: Cambia esto a 'https' después de correr Certbot
        hostname: 'www.rxsolutionmeds.com',
        port: '',
        pathname: '/uploads/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
