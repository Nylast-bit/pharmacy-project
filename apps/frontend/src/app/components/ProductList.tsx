"use client"

import { useEffect, useState, useRef } from "react"
import ProductCard from "./ProductCard"
import { useCart } from "../context/CartContext"
import { API_BASE_URL } from "@/lib/config"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

interface Product {
  id_producto: number
  nombre: string
  descripcion?: string | null
  precio: number
  stock: number
  imagen_url?: string | null
  fecha_creacion: string
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true) // carga inicial
  const [searching, setSearching] = useState(false) // búsqueda
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const { addToCart } = useCart()
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)

  const ITEMS_PER_PAGE = 6

  useEffect(() => {
    fetchProducts(false) // primer fetch no es "search"
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      fetchProducts(false)
      return
    }
    const timeoutId = setTimeout(() => {
      fetchProducts(true) // ahora sí es búsqueda
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const fetchProducts = async (isSearch: boolean) => {
    try {
      if (isSearch) {
        setSearching(true)
      } else {
        setLoading(true)
      }

      if (containerRef.current) {
        scrollPositionRef.current = window.scrollY
      }

      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)

      const res = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`)
      const data = await res.json()
      setProducts(data)
      setCurrentPage(1)

      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current)
      })
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  const handleSelect = (id: number) => {
    const product = products.find((p) => p.id_producto === id)
    if (product) {
      addToCart({
        id_producto: product.id_producto,
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio: product.precio,
        imagen_url: product.imagen_url,
      })
    }
  }

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentProducts = products.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    document.getElementById("product-list-top")?.scrollIntoView({ behavior: "smooth" })
  }

  if (loading) {
    return <p className="text-center py-10">Cargando productos...</p>
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center py-12">
      <h2 id="product-list-top" className="text-4xl font-bold mb-8">Our Products</h2>

      {/* Search Bar */}
      <div className="w-[30%] mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400">
            {searching ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="w-[70%]">
        {products.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No products found</p>
        ) : (
          <>
            <div className="max-h-[1300px] overflow-y-auto pr-2 mb-12 scroll-smooth">
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 transition-opacity duration-300 ${
                  searching ? "opacity-50" : "opacity-100"
                }`}
              >
                {currentProducts.map((p) => (
                  <ProductCard
                    key={p.id_producto}
                    id_producto={p.id_producto}
                    nombre={p.nombre}
                    descripcion={p.descripcion}
                    precio={p.precio}
                    imagen_url={p.imagen_url}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>

            {/* Pagination - siempre visible */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-2">
                {totalPages > 0 ? (
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-4 py-2 rounded-lg transition ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))
                ) : (
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                    disabled
                  >
                    1
                  </button>
                )}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <p className="text-center text-gray-600 mt-4">
              Showing {startIndex + 1}-{Math.min(endIndex, products.length)} of {products.length} products
            </p>
          </>
        )}
      </div>
    </div>
  )
}
