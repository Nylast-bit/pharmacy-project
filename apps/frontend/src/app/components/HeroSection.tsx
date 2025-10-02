"use client"

import Image from "next/image"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="relative w-full h-[80vh] flex items-center justify-center bg-gray-100 overflow-hidden">
      {/* Imagen de fondo (placeholder) */}
      <div className="absolute inset-0">
        <Image
          src="/hero-placeholder.png" // 👉 luego reemplazas con tu imagen real
          alt="Hero background"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/40" /> {/* Overlay oscuro */}
      </div>

      {/* Contenido */}
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Welcome to Our Pharmacy
        </h1>
        <p className="text-lg md:text-xl mb-6 max-w-2xl mx-auto">
          Find the best products at the best price, with the confidence you deserve.
        </p>
        <Link
          href="#productos"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
        >
          View Products
        </Link>
      </div>
    </section>
  )
}
