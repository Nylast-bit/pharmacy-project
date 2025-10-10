/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hcxhpldalsvjftgezvfu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  eslint: {
    // ⚠️ Solo para desarrollo/pruebas - NO para producción
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠️ Solo para desarrollo/pruebas - NO para producción
    ignoreBuildErrors: true,
  },
}

