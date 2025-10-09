"use client"

import { useEffect, useState, useMemo } from "react"
import { API_BASE_URL } from "@/lib/config"
import { ArrowUpDown, Eye, CheckCircle2, Clipboard, Package, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"

interface Order {
  id_pedido: number
  id_cliente: number
  fecha_pedido: string
  estatus: string
  total: number
  notificado: boolean
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order | "cliente"; direction: "asc" | "desc" | null }>({
    key: "id_pedido",
    direction: null,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [showCompleted, setShowCompleted] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail[] | null>(null)
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null)

  const itemsPerPage = 10

  // 🔁 Fetch orders + customers
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
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  // 🔍 Filter
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const searchLower = search.toLowerCase()
      const name = o.cliente?.nombre?.toLowerCase() || ""
      const match = name.includes(searchLower) || o.id_pedido.toString().includes(searchLower)
      const statusFilter = showCompleted ? true : !["completed", "completado"].includes(o.estatus.toLowerCase())
      return match && statusFilter
    })
  }, [orders, search, showCompleted])

  // ↕️ Sort
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

  // 📄 Pagination
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // 🧮 Change sort order when clicking column header
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

    const res = await fetch(`${API_BASE_URL}/api/order-details/order/${id_pedido}`)
    const data: OrderDetail[] = await res.json()
    setSelectedOrder(data)
    setActiveOrderId(id_pedido)
  }

  // ✏️ Mark as completed + notified
  const handleCompleteOrder = async (id_pedido: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/orders/${id_pedido}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estatus: "completed", notificado: true }),
      })
      setOrders((prev) =>
        prev.map((o) =>
          o.id_pedido === id_pedido ? { ...o, estatus: "completed", notificado: true } : o
        )
      )
    } catch (err) {
      console.error("Error updating order:", err)
    }
  }

  // 📋 Copy order details
  const handleCopy = (order: Order) => {
    if (!order.cliente) return
    const summary = `
🧾 Pedido #${order.id_pedido}
👤 Cliente: ${order.cliente.nombre}
📧 Correo: ${order.cliente.correo}
📞 Teléfono: ${order.cliente.telefono}
🏠 Dirección: ${order.cliente.direccion}
💰 Total: $${order.total.toFixed(2)}
📅 Fecha: ${new Date(order.fecha_pedido).toLocaleString()}
Estatus: ${order.estatus}
    `
    navigator.clipboard.writeText(summary)
    alert("✅ Detalles del pedido copiados al portapapeles")
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
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
              <p className="text-gray-600 text-sm mt-1">
                Manage and track all customer orders
              </p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#00a2b9]">
            <p className="text-gray-600 text-sm font-medium mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{sortedOrders.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm font-medium mb-1">Pending</p>
            <p className="text-3xl font-bold text-gray-900">
              {sortedOrders.filter(o => ["pending", "pendiente"].includes(o.estatus.toLowerCase())).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium mb-1">Completed</p>
            <p className="text-3xl font-bold text-gray-900">
              {sortedOrders.filter(o => ["completed", "completado"].includes(o.estatus.toLowerCase())).length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-[#00a2b9] to-[#00c8d7] text-white">
                <tr>
                  {[
                    { key: "id_pedido", label: "Order #" },
                    { key: "cliente", label: "Customer" },
                    { key: "fecha_pedido", label: "Order Date" },
                    { key: "estatus", label: "Status" },
                    { key: "total", label: "Total" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key as any)}
                      className="px-6 py-4 text-left cursor-pointer select-none hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        {col.label}
                        <ArrowUpDown size={16} className="opacity-70" />
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Package className="mx-auto mb-3 text-gray-300" size={48} />
                      <p className="text-gray-500 font-medium">No orders found</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <>
                      <tr key={order.id_pedido} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[#00a2b9]">#{order.id_pedido}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{order.cliente?.nombre || "—"}</p>
                            {order.cliente?.correo && (
                              <p className="text-xs text-gray-500">{order.cliente.correo}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(order.fecha_pedido).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                              ["pending", "pendiente"].includes(order.estatus.toLowerCase())
                                ? "bg-yellow-100 text-yellow-700"
                                : ["completed", "completado"].includes(order.estatus.toLowerCase())
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {order.estatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900 text-base">
                            ${order.total.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewOrder(order.id_pedido)}
                              className="p-2 text-[#00a2b9] hover:bg-[#00a2b9]/10 rounded-lg transition-all hover:scale-110"
                              aria-label="View order details"
                              title="View details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleCompleteOrder(order.id_pedido)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all hover:scale-110"
                              aria-label="Mark as completed"
                              title="Mark as completed"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button
                              onClick={() => handleCopy(order)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all hover:scale-110"
                              aria-label="Copy order details"
                              title="Copy to clipboard"
                            >
                              <Clipboard size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {activeOrderId === order.id_pedido && selectedOrder && (
                        <tr className="bg-gradient-to-r from-[#00a2b9]/5 to-transparent">
                          <td colSpan={6} className="px-6 py-6">
                            <div className="bg-white rounded-xl p-6 shadow-inner border-2 border-[#00a2b9]/20">
                              <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                <Package className="text-[#00a2b9]" size={20} />
                                Order Details
                              </h4>
                              <div className="space-y-3">
                                {selectedOrder.map((d) => (
                                  <div key={d.id_detalle} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">{d.productos.nombre}</p>
                                      <p className="text-sm text-gray-500">
                                        {d.cantidad} × ${d.precio_unitario.toFixed(2)}
                                      </p>
                                    </div>
                                    <p className="font-bold text-[#00a2b9] text-lg">
                                      ${(d.cantidad * d.precio_unitario).toFixed(2)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-6 pt-4 border-t-2 border-[#00a2b9]/20 flex justify-between items-center">
                                <span className="text-gray-700 font-semibold text-lg">Total:</span>
                                <span className="text-2xl font-bold text-[#00a2b9]">
                                  $
                                  {selectedOrder
                                    .reduce((acc, d) => acc + d.cantidad * d.precio_unitario, 0)
                                    .toFixed(2)}
                                </span>
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
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                <span className="font-semibold">
                  {Math.min(currentPage * itemsPerPage, sortedOrders.length)}
                </span>{" "}
                of <span className="font-semibold">{sortedOrders.length}</span> orders
              </p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPage === 1
                      ? "text-gray-400 bg-gray-200 cursor-not-allowed"
                      : "text-white bg-[#00a2b9] hover:bg-[#008899] shadow-md hover:shadow-lg"
                  }`}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPage === totalPages || totalPages === 0
                      ? "text-gray-400 bg-gray-200 cursor-not-allowed"
                      : "text-white bg-[#00a2b9] hover:bg-[#008899] shadow-md hover:shadow-lg"
                  }`}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}