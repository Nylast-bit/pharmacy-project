"use client"

import { useState } from "react"
import { useCart } from "../context/CartContext"
import { API_BASE_URL } from "@/lib/config"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { cart, getTotalPrice, clearCart } = useCart()

  const [nombre, setNombre] = useState("")
  const [correo, setCorreo] = useState("")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [loading, setLoading] = useState(false)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)

  if (!isOpen) return null

  const handlePlaceOrder = async () => {
    try {
      setLoading(true)

      // 1️⃣ Crear cliente
      const resCustomer = await fetch(`${API_BASE_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, correo, telefono, direccion }),
      })

      if (!resCustomer.ok) throw new Error("Error creating customer")
      const customer = await resCustomer.json()

      // 2️⃣ Crear orden
      const resOrder = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cliente: customer.id_cliente,
          total: getTotalPrice(),
          estatus: "pending",
          notificado: false,
        }),
      })

      if (!resOrder.ok) throw new Error("Error creating order")
      const order = await resOrder.json()

      // 3️⃣ Crear order details
      for (const item of cart) {
        await fetch(`${API_BASE_URL}/api/order-details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_pedido: order.id_pedido,
            id_producto: item.id_producto,
            cantidad: item.quantity,
            precio_unitario: item.precio,
          }),
        })
      }

      // 4️⃣ Mostrar número de orden
      setOrderNumber(order.id_pedido)
      clearCart()
    } catch (err) {
      console.error(err)
      alert("Error placing order")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
          <h2 className="text-2xl font-bold mb-4">Checkout</h2>

          {orderNumber ? (
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-green-600">
                Order Completed ✅
              </h3>
              <p>Your order number is:</p>
              <p className="text-2xl font-bold">{orderNumber}</p>
              <button
                onClick={onClose}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Full Name"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Email"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Phone"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
                <input
                  className="w-full border p-2 rounded"
                  placeholder="Address"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>

              <button
                disabled={loading}
                onClick={handlePlaceOrder}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Placing order..." : "Place Order"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
