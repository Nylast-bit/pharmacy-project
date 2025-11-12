"use client"

import { useEffect, useState, useMemo } from "react"
import { ArrowUpDown, Eye, CheckCircle2, Clipboard, Package, Search, Filter, ChevronLeft, ChevronRight, Truck, X } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"
import Image from "next/image"


// --- Data Interfaces ---
interface Order {
  id_pedido: number
  id_cliente: number
  fecha_pedido: string
  estatus: string
  total: number
  notificado: boolean
  trackingnumber?: string | null
  cliente?: Customer
}

interface Customer {
  id_cliente: number
  nombre: string
  correo: string
  telefono: string
  direccion: string
  fecha_creacion: string
}

interface OrderDetail {
  id_detalle: number
  id_pedido: number
  id_producto: number
  cantidad: number
  precio_unitario: number
  productos: {
    nombre: string
    precio: number
    imagen_url: string | null
    descripcion: string
  }
}

// --- Main Component ---
export default function OrdersPage() {
  // --- Component State ---
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order | "cliente"; direction: "asc" | "desc" | null }>({ key: "id_pedido", direction: null })
  const [currentPage, setCurrentPage] = useState(1)
  const [showCompleted, setShowCompleted] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail[] | null>(null)
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null)
  
  // --- States for Modal and Notifications ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentOrderForUpdate, setCurrentOrderForUpdate] = useState<Order | null>(null)
  const [trackingNumberInput, setTrackingNumberInput] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const itemsPerPage = 10

  // --- Hooks ---

  // Effect to show and hide the toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null)
      }, 3000) // Toast disappears after 3 seconds
      return () => clearTimeout(timer)
    }
  }, [toastMessage])
  
  // 🔁 Fetch orders and customers on page load
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/`)
        const data: Order[] = await res.json()

        const enriched = await Promise.all(
          data.map(async (o) => {
            try {
              const resC = await fetch(`${API_BASE_URL}/api/customers/${o.id_cliente}`)
              const c = await resC.json()
              return { ...o, cliente: c }
            } catch {
              return { ...o, cliente: undefined }
            }
          })
        )

        setOrders(enriched)
      } catch (e) {
        console.error("Error fetching orders:", e)
        setToastMessage("Error: Could not fetch orders.")
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  // 🔍 Memoization for filtering orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const searchLower = search.toLowerCase()
      const name = o.cliente?.nombre?.toLowerCase() || ""
      const match = name.includes(searchLower) || o.id_pedido.toString().includes(searchLower)
      const statusFilter = showCompleted ? true : !["completed"].includes(o.estatus.toLowerCase())
      return match && statusFilter
    })
  }, [orders, search, showCompleted])

  // ↕️ Memoization for sorting orders
  const sortedOrders = useMemo(() => {
    if (!sortConfig.direction) return filteredOrders
    return [...filteredOrders].sort((a, b) => {
      const key = sortConfig.key
      let aVal: any = key === "cliente" ? a.cliente?.nombre || "" : a[key]
      let bVal: any = key === "cliente" ? b.cliente?.nombre || "" : b[key]
      if (typeof aVal === "string") aVal = aVal.toLowerCase()
      if (typeof bVal === "string") bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
  }, [filteredOrders, sortConfig])

  // 📄 Pagination logic
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // --- Event Handlers ---

  // 🧮 Change column sort order
  const handleSort = (key: keyof Order | "cliente") => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" }
        if (prev.direction === "desc") return { key, direction: null }
      }
      return { key, direction: "asc" }
    })
  }

  // 👁️ Show order details
  const handleViewOrder = async (id_pedido: number) => {
    if (activeOrderId === id_pedido) {
      setSelectedOrder(null)
      setActiveOrderId(null)
      return
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/order-details/order/${id_pedido}`)
        const data: OrderDetail[] = await res.json()
        setSelectedOrder(data)
        setActiveOrderId(id_pedido)
    } catch (e) {
        console.error("Error fetching order details:", e)
        setToastMessage("Error: Could not fetch order details.")
    }
  }
  
  // 📋 Copy order details
  const handleCopy = (order: Order) => {
    if (!order.cliente) return
    const summary = `
🧾 Order #${order.id_pedido}
👤 Customer: ${order.cliente.nombre}
📧 Email: ${order.cliente.correo}
📞 Phone: ${order.cliente.telefono}
🏠 Address: ${order.cliente.direccion}
💰 Total: $${order.total.toFixed(2)}
📅 Date: ${new Date(order.fecha_pedido).toLocaleString()}
 Status: ${order.estatus}
 ${order.trackingnumber ? `🚚 Tracking: ${order.trackingnumber}` : ''}
    `
    navigator.clipboard.writeText(summary.trim())
    setToastMessage("✅ Order details copied to clipboard")
  }

  // --- Status Update Logic ---

  // Main function to start the update process
  const handleUpdateStatusClick = (order: Order) => {
    const status = order.estatus.toLowerCase()
    if (status === 'pending') {
      setCurrentOrderForUpdate(order)
      setTrackingNumberInput(order.trackingnumber || "")
      setIsModalOpen(true)
    } else if (status === 'shipped') {
      updateOrderStatus(order, 'completed', order.trackingnumber)
    }
  }

  // Handles the modal form submission
  const handleModalSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (currentOrderForUpdate) {
          updateOrderStatus(currentOrderForUpdate, 'shipped', trackingNumberInput)
      }
      closeModal()
  }
  
  // Closes the modal and resets state
  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentOrderForUpdate(null)
    setTrackingNumberInput("")
  }

  // Core function that makes the API call and updates local state
  const updateOrderStatus = async (orderToUpdate: Order, newStatus: string, trackingNumber: string | null | undefined) => {
    // Create a deep copy of the order to modify
    const updatedOrder = { ...orderToUpdate };
    
    // Set the new values
    updatedOrder.estatus = newStatus;
    updatedOrder.notificado = true;
    if (newStatus === 'shipped') {
        updatedOrder.trackingnumber = trackingNumber;
    }

    // Remove the nested 'cliente' object before sending, as the API likely doesn't need it for an update
    const { cliente, ...payload } = updatedOrder;

    try {
      await fetch(`${API_BASE_URL}/api/orders/${orderToUpdate.id_pedido}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Send the complete, updated payload
      })
      
      // Optimistic UI Update
      setOrders(prev =>
        prev.map(o =>
          o.id_pedido === orderToUpdate.id_pedido
            ? { ...o, estatus: newStatus, trackingnumber: trackingNumber || o.trackingnumber }
            : o
        )
      )
      setToastMessage(`✅ Order #${orderToUpdate.id_pedido} updated to "${newStatus}"`)

    } catch (err) {
      console.error("Error updating order:", err)
      setToastMessage("❌ Error updating order.")
    }
  }

  // --- Render ---

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-[#00a2b9] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#00a2b9] to-[#00c8d7] bg-clip-text text-transparent flex items-center gap-3">
                <Package className="text-[#00a2b9]" size={32} />
                Orders Management
              </h2>
              <p className="text-gray-600 text-sm mt-1">Manage and track all customer orders</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-4 focus:ring-[#00a2b9]/10 focus:border-[#00a2b9] focus:outline-none transition-all"
                  placeholder="Search by customer or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-[#00a2b9] transition-all cursor-pointer group">
                <Filter className="text-gray-400 group-hover:text-[#00a2b9] transition-colors" size={18} />
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={() => setShowCompleted(!showCompleted)}
                  className="w-4 h-4 accent-[#00a2b9] cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">Show completed</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-[#00a2b9] to-[#00c8d7] text-white">
                <tr>
                  {[
                    { key: "id_pedido", label: "Order #" }, { key: "cliente", label: "Customer" },
                    { key: "fecha_pedido", label: "Date" }, { key: "estatus", label: "Status" },
                    { key: "total", label: "Total" }, { key: "trackingnumber", label: "Tracking #" }
                  ].map((col) => (
                    <th key={col.key} onClick={() => handleSort(col.key as any)} className="px-6 py-4 text-left cursor-pointer select-none hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-2 font-semibold">{col.label} <ArrowUpDown size={16} className="opacity-70" /></div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Package className="mx-auto mb-3 text-gray-300" size={48} />
                      <p className="text-gray-500 font-medium">No orders found</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <>
                      <tr key={order.id_pedido} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4"><span className="font-semibold text-[#00a2b9]">#{order.id_pedido}</span></td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{order.cliente?.nombre || "—"}</p>
                            {order.cliente?.correo && (<p className="text-xs text-gray-500">{order.cliente.correo}</p>)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{new Date(order.fecha_pedido).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                              order.estatus.toLowerCase() === 'pending' ? "bg-yellow-100 text-yellow-800"
                            : order.estatus.toLowerCase() === 'shipped' ? "bg-blue-100 text-blue-800"
                            : order.estatus.toLowerCase() === 'completed' ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-600"
                          }`}>{order.estatus}</span>
                        </td>
                        <td className="px-6 py-4"><span className="font-bold text-gray-900 text-base">${order.total.toFixed(2)}</span></td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-700">{order.trackingnumber || "—"}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                             <button onClick={() => handleViewOrder(order.id_pedido)} className="p-2 text-[#00a2b9] hover:bg-[#00a2b9]/10 rounded-lg transition-all hover:scale-110" title="View details"><Eye size={18} /></button>
                             <button
                                onClick={() => handleUpdateStatusClick(order)}
                                disabled={order.estatus.toLowerCase() === 'completed'}
                                className={`p-2 rounded-lg transition-all hover:scale-110 ${
                                    order.estatus.toLowerCase() === 'pending' ? 'text-blue-600 hover:bg-blue-50'
                                  : order.estatus.toLowerCase() === 'shipped' ? 'text-green-600 hover:bg-green-50'
                                  : 'text-gray-400 cursor-not-allowed'
                                }`}
                                title={
                                    order.estatus.toLowerCase() === 'pending' ? 'Mark as Shipped'
                                  : order.estatus.toLowerCase() === 'shipped' ? 'Mark as Completed'
                                  : 'Order Completed'
                                }
                              >
                                {order.estatus.toLowerCase() === 'pending' && <Truck size={18} />}
                                {order.estatus.toLowerCase() === 'shipped' && <CheckCircle2 size={18} />}
                                {order.estatus.toLowerCase() === 'completed' && <CheckCircle2 size={18} />}
                             </button>
                             <button onClick={() => handleCopy(order)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all hover:scale-110" title="Copy to clipboard"><Clipboard size={18} /></button>
                          </div>
                        </td>
                      </tr>
                      {/* Order Details (expandable) */}
                      {activeOrderId === order.id_pedido && selectedOrder && (
                        <tr className="bg-gradient-to-r from-[#00a2b9]/5 to-transparent">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white rounded-xl p-6 shadow-inner border-2 border-[#00a2b9]/20">
                              <h4 className="font-bold text-lg text-gray-900 mb-2 flex items-center gap-2"><Package className="text-[#00a2b9]" size={20} /> Order Details</h4>
                              {order.trackingnumber && (
                                <div className="mb-4 text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                                  <strong>Tracking Number:</strong> <span className="font-mono bg-blue-100 px-2 py-1 rounded">{order.trackingnumber}</span>
                                </div>
                              )}
                              <div className="space-y-3">
                                {selectedOrder.map((d) => (
                                  <div 
                                    key={d.id_detalle} 
                                    className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                                  >
                                    
                                    {/* Usamos un ternario:
                                      Si 'd.productos' existe (no es null), es un producto.
                                      Si es 'null', es el envío.
                                    */}

                                    {d.productos ? (
                                      // --- A. SI ES UN PRODUCTO ---
                                      <>
                                        <div className="flex items-center gap-3">
                                          <Image 
                                            src={`${API_BASE_URL}${d.productos.imagen_url || "/default-product.png"}`} 
                                            alt={d.productos.nombre}
                                            width={48}
                                            height={48}
                                            className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                                          />
                                          <div>
                                            <p className="font-medium text-gray-900">{d.productos.nombre}</p>
                                            <p className="text-sm text-gray-500">{d.cantidad} × ${d.precio_unitario.toFixed(2)}</p>
                                          </div>
                                        </div>
                                        <p className="font-bold text-[#00a2b9] text-lg">
                                          ${(d.cantidad * d.precio_unitario).toFixed(2)}
                                        </p>
                                      </>
                                    ) : (
                                      // --- B. SI ES EL ENVÍO ---
                                      <>
                                        <div className="flex items-center gap-3">
                                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <Truck className="w-6 h-6 text-gray-500" />
                                          </div>
                                          <div>
                                            <p className="font-medium text-gray-900">Shipping Feedback</p>
                                            <p className="text-sm text-gray-500">Fix</p>
                                          </div>
                                        </div>
                                        <p className="font-bold text-[#00a2b9] text-lg">
                                          ${d.precio_unitario.toFixed(2)}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginatedOrders.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t">
              <p className="text-sm text-gray-600">Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold">{Math.min(currentPage * itemsPerPage, sortedOrders.length)}</span> of <span className="font-semibold">{sortedOrders.length}</span> orders</p>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === 1 ? "text-gray-400 bg-gray-200 cursor-not-allowed" : "text-white bg-[#00a2b9] hover:bg-[#008899] shadow-md hover:shadow-lg"}`}><ChevronLeft size={16} /> Previous</button>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === totalPages || totalPages === 0 ? "text-gray-400 bg-gray-200 cursor-not-allowed" : "text-white bg-[#00a2b9] hover:bg-[#008899] shadow-md hover:shadow-lg"}`}>Next <ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* --- Modal for Tracking Number --- */}
      {isModalOpen && currentOrderForUpdate && (
         <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 transition-opacity animate-in fade-in-0">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Truck className="text-[#00a2b9]" /> Mark as Shipped
                  </h3>
                   <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full"><X size={20}/></button>
                </div>
                <p className="text-gray-600 mb-6">
                  Enter the tracking number for order <strong className="text-[#00a2b9]">#{currentOrderForUpdate.id_pedido}</strong>.
                </p>
                <form onSubmit={handleModalSubmit}>
                    <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-2">Tracking Number</label>
                    <input
                        id="trackingNumber"
                        type="text"
                        value={trackingNumberInput}
                        onChange={(e) => setTrackingNumberInput(e.target.value)}
                        placeholder="e.g., 1Z999AA10123456784"
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-4 focus:ring-[#00a2b9]/20 focus:border-[#00a2b9] focus:outline-none transition-all"
                        required
                    />
                    <div className="flex justify-end gap-3 mt-8">
                        <button type="button" onClick={closeModal} className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-3 rounded-xl bg-[#00a2b9] text-white font-semibold hover:bg-[#008899] transition-colors shadow-lg shadow-[#00a2b9]/20">Save and Notify</button>
                    </div>
                </form>
            </div>
         </div>
      )}

      {/* --- Toast for notifications --- */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg transition-all animate-in slide-in-from-bottom-5">
            <p>{toastMessage}</p>
        </div>
      )}

    </div>
  )
}

