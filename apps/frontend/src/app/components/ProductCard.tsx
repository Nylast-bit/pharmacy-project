"use client"

import Image from "next/image"
import React from "react"
import { API_BASE_URL } from "@/lib/config"

export interface ProductCardProps {
  id_producto: number
  nombre: string
  descripcion?: string | null
  precio: number
  imagen_url?: string | null
  onSelect: (id: number) => void
}

const ProductCard: React.FC<ProductCardProps> = ({
  id_producto,
  nombre,
  descripcion,
  precio,
  imagen_url,
  onSelect,
}) => {
  // imagen default local
  const imageSrc = API_BASE_URL + imagen_url || "/default-product.png"

  return (
    <div className="rounded-xl border shadow-md hover:shadow-lg transition p-4 flex flex-col">
      {/* Imagen */}
      <div className="w-full h-84 relative mb-3">
        <Image
          src={imageSrc}
          alt={nombre}
          fill
          className="object-cover rounded-lg"
        />
      </div>


      {/* Info */}
      <h3 className="text-lg font-semibold">{nombre}</h3>
      <p className="text-sm text-gray-600 flex-1">{descripcion}</p>
      <span className="text-green-600 font-bold mt-2">
        ${precio.toFixed(2)}
      </span>

      {/* Botón */}
      <button
        onClick={() => onSelect(id_producto)}
        className="mt-4 bg-[#00a2b9] hover:bg-[#008899] text-white px-4 py-2 rounded-lg transition cursor-pointer"
      >
        Add to Cart
      </button>
    </div>
  )
}

export default ProductCard
