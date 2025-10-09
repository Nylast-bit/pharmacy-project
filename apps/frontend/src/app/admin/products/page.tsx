"use client"

import React, { useEffect, useState } from "react"
import ProductAdminCard from "@/app/components/ProductAdminCard"
import ProductModal from "@/app/components/NewProductModal"
import { API_BASE_URL } from "@/lib/config"

interface Product {
  id_producto: number
  nombre: string
  descripcion?: string | null
  precio: number
  stock: number
  imagen_url?: string | null
  fecha_creacion?: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage] = useState(8)
  const [showModal, setShowModal] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined)

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setProducts(data)
        setFiltered(data)
      } else {
        setProducts([])
        setFiltered([])
      }
    } catch (err) {
      console.error("Error fetching products:", err)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Filtrado por search
  useEffect(() => {
    const filteredData = products.filter((p) =>
      `${p.nombre} ${p.descripcion || ""}`.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(filteredData)
    setCurrentPage(1)
  }, [search, products])

  // Ordenar por precio
  useEffect(() => {
    const sorted = [...filtered].sort((a, b) =>
      sortOrder === "asc" ? a.precio - b.precio : b.precio - a.precio
    )
    setFiltered(sorted)
  }, [sortOrder])

  // Paginación
  const totalPages = Math.ceil(filtered.length / perPage)
  const startIndex = (currentPage - 1) * perPage
  const paginated = filtered.slice(startIndex, startIndex + perPage)

  const handleEdit = (product: Product) => {
    setProductToEdit(product)
    setShowModal(true)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-[#00a2b9]">Products</h2>

        <div className="flex items-center gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-60 focus:ring-2 focus:ring-[#00a2b9] outline-none"
          />

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#00a2b9]"
          >
            <option value="asc">Price: Low to High</option>
            <option value="desc">Price: High to Low</option>
          </select>

          {/* New Product */}
          <button
            className="bg-[#00a2b9] hover:bg-[#008899] text-white px-4 py-2 rounded-lg font-semibold"
            onClick={() => {
              setProductToEdit(undefined)
              setShowModal(true)
            }}
          >
            + New Product
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginated.map((p) => (
            <ProductAdminCard
              key={p.id_producto}
              id_producto={p.id_producto}
              nombre={p.nombre}
              descripcion={p.descripcion}
              precio={p.precio}
              stock={p.stock}
              imagen_url={p.imagen_url}
              onDeleteSuccess={fetchProducts}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center mt-10">No products yet.</p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ⬅
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ➡
          </button>
        </div>
      )}

      {/* Modal para crear o editar */}
      {showModal && (
        <ProductModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          productToEdit={productToEdit}
          onProductUpdated={fetchProducts}
        />
      )}
    </div>
  )
}
