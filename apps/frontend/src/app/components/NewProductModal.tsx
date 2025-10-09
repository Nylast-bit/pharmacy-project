"use client"

import { useEffect, useState, ChangeEvent, FormEvent } from "react"
import { API_BASE_URL } from "@/lib/config"
import { X, Upload, Package, DollarSign, FileText, Image as ImageIcon } from "lucide-react"

export interface Product {
  id_producto: number
  nombre: string
  descripcion?: string | null
  precio: number
  stock: number
  imagen_url?: string | null
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  productToEdit?: Product
  onProductUpdated: () => void
}

export default function ProductModal({
  isOpen,
  onClose,
  productToEdit,
  onProductUpdated,
}: ProductModalProps) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [precio, setPrecio] = useState("")
  const [stock, setStock] = useState("")
  const [imagen, setImagen] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Precargar datos si es edición
  useEffect(() => {
    if (productToEdit) {
      setNombre(productToEdit.nombre)
      setDescripcion(productToEdit.descripcion || "")
      setPrecio(productToEdit.precio.toString())
      setStock(productToEdit.stock.toString())
      setImagen(null)
      setError("")
    } else {
      setNombre("")
      setDescripcion("")
      setPrecio("")
      setStock("")
      setImagen(null)
      setError("")
    }
  }, [productToEdit])

  if (!isOpen) return null

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const file = e.target.files[0]
    if (!file) return

    if (!["image/png", "image/jpeg", "image/jpg", "image/gif"].includes(file.type)) {
      setError("Only PNG, JPEG, JPG or GIF files are allowed.")
      return
    }
    setError("")
    setImagen(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (!nombre || !precio || !stock) {
      setError("Please fill in all required fields.")
      return
    }

    if (!productToEdit && !imagen) {
      setError("Please select an image for the product.")
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("nombre", nombre)
      formData.append("descripcion", descripcion)
      formData.append("precio", precio)
      formData.append("stock", stock)
      if (imagen) formData.append("image", imagen)

      let res: Response
      if (productToEdit) {
        res = await fetch(`${API_BASE_URL}/api/products/${productToEdit.id_producto}`, {
          method: "PUT",
          body: formData,
        })
      } else {
        res = await fetch(`${API_BASE_URL}/api/products`, {
          method: "POST",
          body: formData,
        })
      }

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to save product.")
        setLoading(false)
        return
      }

      alert(`Product ${productToEdit ? "updated" : "created"} successfully!`)
      onProductUpdated()
      onClose()
    } catch (err) {
      console.error(err)
      setError("An error occurred while saving the product.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 my-8">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-[#00a2b9] to-[#00c8d7] px-6 py-4 md:px-8 md:py-6 relative">
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all duration-200 hover:rotate-90"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
          
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            {productToEdit ? (
              <>
                <FileText className="w-7 h-7" />
                Edit Product
              </>
            ) : (
              <>
                <Package className="w-7 h-7" />
                Add New Product
              </>
            )}
          </h2>
          <p className="text-white/90 text-sm mt-1">
            {productToEdit ? "Update your product information" : "Fill in the details to add a new product"}
          </p>
        </div>

        {/* Contenido del formulario */}
        <div className="p-6 md:p-8 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Nombre del producto */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-[#00a2b9] focus:ring-4 focus:ring-[#00a2b9]/10 transition-all"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  placeholder="Enter product description (optional)"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-[#00a2b9] focus:ring-4 focus:ring-[#00a2b9]/10 transition-all resize-none"
                />
              </div>
            </div>

            {/* Precio y Stock en grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Precio */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-[#00a2b9] focus:ring-4 focus:ring-[#00a2b9]/10 transition-all"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-[#00a2b9] focus:ring-4 focus:ring-[#00a2b9]/10 transition-all"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Upload de imagen */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Image {!productToEdit && <span className="text-red-500">*</span>}
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#00a2b9] transition-all bg-gray-50 hover:bg-[#00a2b9]/5">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
                  <div className="w-16 h-16 bg-[#00a2b9]/10 rounded-full flex items-center justify-center mb-3">
                    {imagen ? (
                      <ImageIcon className="w-8 h-8 text-[#00a2b9]" />
                    ) : (
                      <Upload className="w-8 h-8 text-[#00a2b9]" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {imagen ? imagen.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, JPEG or GIF (max. 10MB)
                  </p>
                </label>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00a2b9] to-[#00c8d7] hover:from-[#008899] hover:to-[#00a2b9] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {productToEdit ? "Update Product" : "Add Product"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}