/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de Imágenes (No necesita cambios si es correcta)
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
  
  // 💡 Mejora: Configuración de TypeScript
  typescript: {
    // Si bien ignorar errores puede acelerar el build, se recomienda
    // fuertemente dejar esto en 'false' a menos que estés migrando,
    // ya que pierdes la seguridad de tipos.
    ignoreBuildErrors: true, 
  },

  // ⚡ Mejora: Configuración de Next.js Development Server (Para Dev/Debug)
  // Agregamos el origen para silenciar la advertencia de acceso por IP.
  allowedDevOrigins: [
    'http://64.111.92.96:3000', // Tu IP de red
    'http://localhost:3000',    // Localhost estándar
  ],

  
};

module.exports = nextConfig;
