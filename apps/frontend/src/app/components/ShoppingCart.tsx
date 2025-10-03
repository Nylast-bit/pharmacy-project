"use client"

import Image from "next/image"
import { useCart } from "../context/CartContext"
import { X, ShoppingBag, Minus, Plus, Trash2 } from "lucide-react"

interface ShoppingCartProps {
  isOpen: boolean
  onClose: () => void
  onCheckout: () => void
}

export default function ShoppingCart({ isOpen, onClose, onCheckout }: ShoppingCartProps) {
  const { cart, updateQuantity, removeFromCart, getTotalPrice } = useCart()

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-xl font-bold">Cart ({cart.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">Your cart is empty.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id_producto} className="flex gap-3 border-b pb-4">
                  {/* Image */}
                  <div className="relative w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
                    <Image
                      src={item.imagen_url || "/default-product.png"}
                      alt={item.nombre}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{item.nombre}</h3>
                    <p className="text-[#00a2b9] font-bold mt-1">
                      ${item.precio.toFixed(2)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-2 border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id_producto, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-2 font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id_producto, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id_producto)}
                        className="ml-auto text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-[#00a2b9]">
                ${getTotalPrice().toFixed(2)}
              </span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-[#00a2b9] hover:bg-[#008899] text-white py-3 rounded-lg font-semibold transition"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  )
}