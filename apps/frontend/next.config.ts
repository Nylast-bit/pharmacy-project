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
  allowedDevOrigins: [
    'http://64.111.92.96:3000', // Tu IP de red
    'http://localhost:3000',    // Localhost estándar
  ],  
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
