"use client"

import { useState, useEffect } from "react"
import { useCart } from "../context/CartContext"
import { API_BASE_URL } from "@/lib/config"
import { X, User, Mail, Phone, MapPin, ShoppingBag, CheckCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [error, setError] = useState("")
  const [orderNumber, setOrderNumber] = useState<number | null>(null)

  // 👇 Nuevo estado para lookup
  const [idCliente, setIdCliente] = useState<number | null>(null)
  const [possibleCustomer, setPossibleCustomer] = useState<any>(null)
  const [showDialog, setShowDialog] = useState(false)

  // Debounce email/phone lookup
  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        if (correo) {
          const res = await fetch(`${API_BASE_URL}/api/customers/email/${correo}`)
          if (res.ok) {
            const data = await res.json()
            if (data) {
              setPossibleCustomer(data)
              setShowDialog(true)
            }
          }
        } else if (telefono) {
          const res = await fetch(`${API_BASE_URL}/api/customers/phone/${telefono}`)
          if (res.ok) {
            const data = await res.json()
            if (data) {
              setPossibleCustomer(data)
              setShowDialog(true)
            }
          }
        }
      } catch (err) {
        console.error("Lookup error", err)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [correo, telefono])

  const handlePlaceOrder = async () => {
    if (!nombre || !correo || !telefono || !direccion) {
      setError("All fields are required before placing the order.")
      return
    }

    try {
      setLoading(true)
      setError("")

      let customerId = idCliente

      // 🆕 Si no tenemos un cliente existente, lo creamos
      if (!customerId) {
        const resCustomer = await fetch(`${API_BASE_URL}/api/customers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, correo, telefono, direccion }),
        })

        if (!resCustomer.ok) {
          const data = await resCustomer.json()
          throw new Error(data.error || "Error creating customer")
        }
        const customer = await resCustomer.json()
        customerId = customer.id_cliente
      }

      // 2️⃣ Crear orden
      const resOrder = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cliente: customerId,
          total: getTotalPrice(),
          estatus: "pending",
          notificado: false,
        }),
      })

      if (!resOrder.ok) throw new Error("Error creating order")
      const order = await resOrder.json()

      // 3️⃣ Crear detalles de la orden
      await fetch(`${API_BASE_URL}/api/order-details/multiple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_pedido: order.id_pedido,
          details: cart.map((item) => ({
            id_producto: item.id_producto,
            cantidad: item.quantity,
            precio_unitario: item.precio,
          })),
        }),
      })

      setOrderNumber(order.id_pedido)
      clearCart()
    } catch (err: any) {
      setError(err.message || "Error placing order")
    } finally {
      setLoading(false)
    }
  }

  // Confirmar cliente existente
  const confirmExisting = () => {
    if (possibleCustomer) {
      setNombre(possibleCustomer.nombre)
      setCorreo(possibleCustomer.correo)
      setTelefono(possibleCustomer.telefono)
      setDireccion(possibleCustomer.direccion || "")
      setIdCliente(possibleCustomer.id_cliente)
    }
    setShowDialog(false)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Elegante popup de confirmación */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Es usted {possibleCustomer?.nombre}?</AlertDialogTitle>
            <AlertDialogDescription>
              Hemos encontrado un cliente registrado con este correo/teléfono. 
              ¿Desea usar esta información para su pedido?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDialog(false)}>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExisting}>Sí</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-slideUp">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {orderNumber ? (
            /* Success State */
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Order Placed Successfully!
                </h3>
                <p className="text-gray-600">
                  Thank you for your purchase. We'll send you a confirmation email shortly.
                </p>
              </div>

              <div className="bg-[#00a2b9]/10 border-2 border-[#00a2b9] rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Your Order Number</p>
                <p className="text-3xl font-bold text-[#00a2b9]">#{orderNumber}</p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-[#00a2b9] hover:bg-[#008899] text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            /* Form State */
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#00a2b9]/10 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-[#00a2b9]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Complete Your Order</h2>
                  <p className="text-sm text-gray-600">
                    {cart.length} {cart.length === 1 ? "item" : "items"} • ${getTotalPrice().toFixed(2)}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handlePlaceOrder(); }}>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a2b9] focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a2b9] focus:border-transparent transition"
                    />
                  </div>
                </div>
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a2b9] focus:border-transparent transition"
                    />
                  </div>
                </div>

                

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      rows={3}
                      required
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="123 Main St, City, State, ZIP"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a2b9] focus:border-transparent transition resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00a2b9] hover:bg-[#008899] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      Place Order - ${getTotalPrice().toFixed(2)}
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By placing this order, you agree to our terms and conditions
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
