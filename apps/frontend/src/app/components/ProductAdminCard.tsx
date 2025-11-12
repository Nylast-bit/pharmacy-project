"use client"

import Image from "next/image"
import { useState } from "react"
import { API_BASE_URL } from "@/lib/config"
import { Trash2, Edit, Package } from "lucide-react"
import ProductModal from "./NewProductModal" // este es el modal editable

export interface ProductAdminCardProps {
  id_producto: number
  nombre: string
  descripcion?: string | null
  precio: number
  stock: number
  imagen_url?: string | null
  onDeleteSuccess: () => void // refresca la lista
}

const ProductAdminCard: React.FC<ProductAdminCardProps> = ({
  id_producto,
  nombre,
  descripcion,
  precio,
  stock,
  imagen_url,
  onDeleteSuccess,
}) => {
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const handleDelete = async () => {
    const confirmDelete = confirm(`Are you sure you want to delete "${nombre}"?`)
    if (!confirmDelete) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id_producto}`, { method: "DELETE" })

      if (!res.ok) {
        const data = await res.json()
        if (data.error?.includes("associated orders")) {
          alert("Cannot delete this product because it has associated orders.")
        } else {
          alert("Failed to delete product.")
        }
        return
      }

      alert("Product deleted successfully!")
      onDeleteSuccess()
    } catch (err) {
      console.error(err)
      alert("An error occurred while deleting the product.")
    }
  }

  const product = { id_producto, nombre, descripcion, precio, stock, imagen_url }
  const imageSrc = API_BASE_URL + imagen_url || "/default-product.png"
  const stockLow = stock < 10

  return (
    <>
      <div className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
        {stockLow && (
          <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Package size={12} /> Low Stock
          </div>
        )}

        <div className="relative w-full h-72 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          <Image 
            src={imageSrc} 
            alt={nombre} 
            fill 
            className="object-cover transition-transform duration-500 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {nombre}
          </h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
            {descripcion || "No description available"}
          </p>

          <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">Price</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ${precio.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Available</p>
              <p className={`text-lg font-semibold ${stockLow ? 'text-red-500' : 'text-gray-700'}`}>
                {stock} units
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-medium px-4 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              <Edit size={18} /> Edit
            </button>

            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-medium px-4 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <Trash2 size={18} /> {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal para editar */}
      {showEditModal && (
        <ProductModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          productToEdit={product}
          onProductUpdated={onDeleteSuccess}
        />
      )}
    </>
  )
}

export default ProductAdminCard
