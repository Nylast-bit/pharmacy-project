/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rxsolutionmeds.com',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.rxsolutionmeds.com',
        port: '',
        pathname: '/uploads/**',
      },
    ],
  },
  
  typescript: {
    ignoreBuildErrors: true, 
  },
};

module.exports = nextConfig;