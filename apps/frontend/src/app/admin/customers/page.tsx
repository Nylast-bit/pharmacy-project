"use client"

import { useEffect, useState, useMemo } from "react"
import { API_BASE_URL } from "@/lib/config"
import { ArrowUpDown, Eye, Trash2, Clipboard, Users, Search, Filter, ChevronLeft, ChevronRight, Mail, Phone, MapPin, Calendar } from "lucide-react"

interface Customer {
  id_cliente: number
  nombre: string
  correo: string
  telefono: string
  direccion: string
  fecha_creacion: string
}

interface Order {
  id_pedido: number
  id_cliente: number
  fecha_pedido: string
  estatus: string
  total: number
  notificado: boolean
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: "asc" | "desc" | null }>({
    key: "id_cliente",
    direction: null,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<Order[] | null>(null)
  const [activeCustomerId, setActiveCustomerId] = useState<number | null>(null)

  const itemsPerPage = 10

  // 🔁 Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/customers/`)
        const data: Customer[] = await res.json()
        setCustomers(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [])

  // 🔍 Filter
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const searchLower = search.toLowerCase()
      const nombre = c.nombre?.toLowerCase() || ""
      const correo = c.correo?.toLowerCase() || ""
      const telefono = c.telefono?.toLowerCase() || ""
      return (
        nombre.includes(searchLower) ||
        correo.includes(searchLower) ||
        telefono.includes(searchLower) ||
        c.id_cliente.toString().includes(searchLower)
      )
    })
  }, [customers, search])

  // ↕️ Sort
  const sortedCustomers = useMemo(() => {
    if (!sortConfig.direction) return filteredCustomers
    return [...filteredCustomers].sort((a, b) => {
      const key = sortConfig.key
      let aVal: any = a[key]
      let bVal: any = b[key]
      if (typeof aVal === "string") aVal = aVal.toLowerCase()
      if (typeof bVal === "string") bVal = bVal.toLowerCase()

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
  }, [filteredCustomers, sortConfig])

  // 📄 Pagination
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage)
  const paginatedCustomers = sortedCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // 🧮 Change sort order when clicking column header
  const handleSort = (key: keyof Customer) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" }
        if (prev.direction === "desc") return { key, direction: null }
      }
      return { key, direction: "asc" }
    })
  }

  // 👁️ Show customer orders
  const handleViewOrders = async (id_cliente: number) => {
    if (activeCustomerId === id_cliente) {
      setSelectedCustomerOrders(null)
      setActiveCustomerId(null)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/`)
      const allOrders: Order[] = await res.json()
      const customerOrders = allOrders.filter(o => o.id_cliente === id_cliente)
      setSelectedCustomerOrders(customerOrders)
      setActiveCustomerId(id_cliente)
    } catch (err) {
      console.error("Error fetching orders:", err)
    }
  }

  // 🗑️ Delete customer
  const handleDeleteCustomer = async (id_cliente: number, nombre: string) => {
    const confirmDelete = confirm(`Are you sure you want to delete customer "${nombre}"?`)
    if (!confirmDelete) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${id_cliente}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.error?.includes("associated orders")) {
          alert("Cannot delete this customer because they have associated orders.")
        } else {
          alert("Failed to delete customer.")
        }
        return
      }

      alert("Customer deleted successfully!")
      setCustomers((prev) => prev.filter((c) => c.id_cliente !== id_cliente))
    } catch (err) {
      console.error("Error deleting customer:", err)
      alert("An error occurred while deleting the customer.")
    }
  }

  // 📋 Copy customer details
  const handleCopy = (customer: Customer) => {
    const summary = `
👤 Cliente #${customer.id_cliente}
Nombre: ${customer.nombre}
📧 Correo: ${customer.correo}
📞 Teléfono: ${customer.telefono}
🏠 Dirección: ${customer.direccion}
📅 Fecha de creación: ${new Date(customer.fecha_creacion).toLocaleString()}
    `
    navigator.clipboard.writeText(summary)
    alert("✅ Detalles del cliente copiados al portapapeles")
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-[#00a2b9] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Loading customers...</p>
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
                <Users className="text-[#00a2b9]" size={32} />
                Customers Management
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Manage and view all customer information
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-4 focus:ring-[#00a2b9]/10 focus:border-[#00a2b9] focus:outline-none transition-all"
                  placeholder="Search by name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#00a2b9]">
            <p className="text-gray-600 text-sm font-medium mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900">{sortedCustomers.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-medium mb-1">New This Month</p>
            <p className="text-3xl font-bold text-gray-900">
              {sortedCustomers.filter(c => {
                const creationDate = new Date(c.fecha_creacion)
                const now = new Date()
                return creationDate.getMonth() === now.getMonth() && creationDate.getFullYear() === now.getFullYear()
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium mb-1">Total Registered</p>
            <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-[#00a2b9] to-[#00c8d7] text-white">
                <tr>
                  {[
                    { key: "id_cliente", label: "ID" },
                    { key: "nombre", label: "Name" },
                    { key: "correo", label: "Email" },
                    { key: "telefono", label: "Phone" },
                    { key: "direccion", label: "Address" },
                    { key: "fecha_creacion", label: "Registered" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key as keyof Customer)}
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
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Users className="mx-auto mb-3 text-gray-300" size={48} />
                      <p className="text-gray-500 font-medium">No customers found</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting your search</p>
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <>
                      <tr key={customer.id_cliente} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[#00a2b9]">#{customer.id_cliente}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{customer.nombre}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail size={14} className="text-gray-400" />
                            <span className="text-sm">{customer.correo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={14} className="text-gray-400" />
                            <span className="text-sm">{customer.telefono}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="text-sm">{customer.direccion}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="text-sm">
                              {new Date(customer.fecha_creacion).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewOrders(customer.id_cliente)}
                              className="p-2 text-[#00a2b9] hover:bg-[#00a2b9]/10 rounded-lg transition-all hover:scale-110"
                              aria-label="View customer orders"
                              title="View orders"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleCopy(customer)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all hover:scale-110"
                              aria-label="Copy customer details"
                              title="Copy to clipboard"
                            >
                              <Clipboard size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id_cliente, customer.nombre)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                              aria-label="Delete customer"
                              title="Delete customer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {activeCustomerId === customer.id_cliente && selectedCustomerOrders && (
                        <tr className="bg-gradient-to-r from-[#00a2b9]/5 to-transparent">
                          <td colSpan={7} className="px-6 py-6">
                            <div className="bg-white rounded-xl p-6 shadow-inner border-2 border-[#00a2b9]/20">
                              <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                <Users className="text-[#00a2b9]" size={20} />
                                Customer Orders
                              </h4>
                              {selectedCustomerOrders.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">This customer has no orders yet.</p>
                              ) : (
                                <div className="space-y-3">
                                  {selectedCustomerOrders.map((order) => (
                                    <div key={order.id_pedido} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">Order #{order.id_pedido}</p>
                                        <p className="text-sm text-gray-500">
                                          {new Date(order.fecha_pedido).toLocaleDateString()} • 
                                          <span className={`ml-2 ${
                                            ["pending", "pendiente"].includes(order.estatus.toLowerCase())
                                              ? "text-yellow-600"
                                              : "text-green-600"
                                          }`}>
                                            {order.estatus}
                                          </span>
                                        </p>
                                      </div>
                                      <p className="font-bold text-[#00a2b9] text-lg">
                                        ${order.total.toFixed(2)}
                                      </p>
                                    </div>
                                  ))}
                                  <div className="mt-6 pt-4 border-t-2 border-[#00a2b9]/20 flex justify-between items-center">
                                    <span className="text-gray-700 font-semibold text-lg">Total Orders:</span>
                                    <span className="text-2xl font-bold text-[#00a2b9]">
                                      {selectedCustomerOrders.length}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-700 font-semibold text-lg">Total Spent:</span>
                                    <span className="text-2xl font-bold text-[#00a2b9]">
                                      ${selectedCustomerOrders.reduce((acc, o) => acc + o.total, 0).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              )}
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
          {paginatedCustomers.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                <span className="font-semibold">
                  {Math.min(currentPage * itemsPerPage, sortedCustomers.length)}
                </span>{" "}
                of <span className="font-semibold">{sortedCustomers.length}</span> customers
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