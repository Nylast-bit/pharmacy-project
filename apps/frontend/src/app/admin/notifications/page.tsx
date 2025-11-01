"use client";

import { useEffect, useState, useMemo, FormEvent } from "react";
// 🔽 Corrección: Se usa una ruta relativa en lugar de un alias
import { API_BASE_URL } from "../../../lib/config";
import {
  ArrowUpDown,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  Send,
  RefreshCcw,
} from "lucide-react";

// 1. Interfaz de Cliente actualizada con el nuevo campo
interface CustomerWithPromo {
  id_cliente: number;
  nombre: string;
  correo: string | null; // Importante: El correo puede ser null
  telefono: string | null;
  direccion: string | null;
  fecha_creacion: string;
  fecha_ultima_promocion: string | null; // El nuevo campo de la DB
}

export default function NotificationsPage() {
  // --- Estados de Datos ---
  const [customers, setCustomers] = useState<CustomerWithPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof CustomerWithPromo;
    direction: "asc" | "desc" | null;
  }>({
    key: "id_cliente",
    direction: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  // --- Estados de UI y Formulario ---
  const [selectedClientIds, setSelectedClientIds] = useState(new Set<number>());
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const itemsPerPage = 10;

  // 🔁 Fetch customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/`);
      const data: CustomerWithPromo[] = await res.json();
      setCustomers(data);
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Error loading customers." });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 🔍 Filter (Modificado para buscar en menos campos)
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const searchLower = search.toLowerCase();
      const nombre = c.nombre?.toLowerCase() || "";
      const correo = c.correo?.toLowerCase() || "";
      return (
        nombre.includes(searchLower) ||
        correo.includes(searchLower) ||
        c.id_cliente.toString().includes(searchLower)
      );
    });
  }, [customers, search]);

  // ↕️ Sort
  const sortedCustomers = useMemo(() => {
    if (!sortConfig.direction) return filteredCustomers;
    return [...filteredCustomers].sort((a, b) => {
      const key = sortConfig.key;
      let aVal: any = a[key];
      let bVal: any = b[key];
      
      // Manejo para fechas (nulls al final o principio)
      if (key === 'fecha_ultima_promocion') {
        if (aVal === null) return 1;
        if (bVal === null) return -1;
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredCustomers, sortConfig]);

  // 📄 Pagination
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const paginatedCustomers = sortedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 🧮 Change sort order
  const handleSort = (key: keyof CustomerWithPromo) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        if (prev.direction === "desc") return { key, direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  // --- Lógica de Selección ---

  const handleSelectClient = (id: number) => {
    setSelectedClientIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Selecciona todos los clientes FILTRADOS que tengan correo
      const allValidIds = filteredCustomers
        .filter((c) => c.correo)
        .map((c) => c.id_cliente);
      setSelectedClientIds(new Set(allValidIds));
    } else {
      setSelectedClientIds(new Set());
    }
  };

  // --- Lógica de Envío de Correo ---

  const sendApiRequest = async (endpoint: string, body: object, successMessage: string) => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/email/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'API Error');
      
      setMessage({ type: 'success', text: data.message || successMessage });
      setSelectedClientIds(new Set()); // Limpia selección
      setSubject(""); // Limpia formulario
      setHtmlBody(""); // Limpia formulario
      fetchCustomers(); // Recarga los clientes para ver la fecha actualizada
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Enviar a la lista seleccionada
  const handleSendToList = (e: FormEvent) => {
    e.preventDefault();
    if (selectedClientIds.size === 0) {
      setMessage({ type: 'error', text: "You haven't selected any customers." });
      return;
    }
    sendApiRequest(
      'send-to-list', 
      {
        clientIds: Array.from(selectedClientIds),
        subject,
        htmlBody,
      },
      "Email sent to selected customers."
    );
  };

  // 2. Enviar a los 100 más recientes
  const handleSendToLatest = () => {
    if (!subject || !htmlBody) {
      setMessage({ type: 'error', text: 'Subject and Email Body are required.' });
      return;
    }
    sendApiRequest(
      'send-to-latest', 
      { subject, htmlBody },
      "Email sent to the 100 most recent customers."
    );
  };
  
  // 3. Resetear notificaciones
  const handleResetNotifications = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to reset the promotion dates for ALL customers?')) {
      return;
    }
    await sendApiRequest(
      'reset-notifications', 
      {},
      "Notifications have been reset."
    );
  };
  
  // 📅 Formateador de Fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return <span className="text-gray-400 italic">Never</span>;
    return new Date(dateString).toLocaleString('en-US'); // Formato local
  };

  // --- Renderizado ---

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="w-16 h-16 border-4 border-[#00a2b9] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-[#00a2b9] to-[#00c8d7] bg-clip-text text-transparent flex items-center gap-3">
                <Send className="text-[#00a2b9]" size={32} />
                Send Promotions
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Select customers and send promotional emails
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-4 focus:ring-[#00a2b9]/10 focus:border-[#00a2b9] focus:outline-none transition-all"
                  placeholder="Search by name, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- 📧 Formulario de Envío --- */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <form onSubmit={handleSendToList} className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-[#00a2b9]/10 focus:border-[#00a2b9] focus:outline-none transition-all"
                placeholder="Weekend Promotion!"
                required
              />
            </div>
            
            <div>
              <label htmlFor="htmlBody" className="block text-sm font-medium text-gray-700 mb-1">
                Email Body (HTML)
              </label>
              <textarea
                id="htmlBody"
                rows={6}
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-[#00a2b9]/10 focus:border-[#00a2b9] focus:outline-none transition-all"
                placeholder="<h1>Hi!</h1><p>We have a 20% discount...</p>"
                required
              />
            </div>

            {/* --- Botones de Acción --- */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || selectedClientIds.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#00a2b9] text-white rounded-xl shadow-md hover:bg-[#008899] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                {isSubmitting ? 'Sending...' : `Send to (${selectedClientIds.size}) selected`}
              </button>
              
              <button
                type="button"
                onClick={handleSendToLatest}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-xl shadow-md hover:bg-gray-800 transition-all disabled:bg-gray-400"
              >
                {isSubmitting ? 'Sending...' : 'Send to 100 Most Recent'}
              </button>
              
              <button
                type="button"
                onClick={handleResetNotifications}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl shadow-md hover:bg-red-700 transition-all disabled:bg-gray-400"
              >
                <RefreshCcw size={18} />
                Reset Dates
              </button>
            </div>
          </form>

          {/* --- Mensajes de Estado --- */}
          {message && (
            <div className={`mt-4 p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* --- 📊 Tabla de Clientes --- */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-[#00a2b9] to-[#00c8d7] text-white">
                <tr>
                  <th className="p-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#00a2b9] focus:ring-[#00a2b9] focus:ring-offset-0"
                      onChange={handleSelectAll}
                      checked={filteredCustomers.length > 0 && selectedClientIds.size === filteredCustomers.filter(c => c.correo).length}
                    />
                  </th>
                  {[
                    { key: "id_cliente", label: "ID" },
                    { key: "nombre", label: "Name" },
                    { key: "correo", label: "Email" },
                    { key: "fecha_ultima_promocion", label: "Last Promotion" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key as keyof CustomerWithPromo)}
                      className="px-6 py-4 text-left cursor-pointer select-none hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        {col.label}
                        <ArrowUpDown size={16} className="opacity-70" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Users className="mx-auto mb-3 text-gray-300" size={48} />
                      <p className="text-gray-500 font-medium">No customers found</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting your search</p>
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <tr 
                      key={customer.id_cliente} 
                      className={`transition-colors ${selectedClientIds.has(customer.id_cliente) ? 'bg-[#00a2b9]/10' : 'hover:bg-gray-50'}`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#00a2b9] focus:ring-[#00a2b9] focus:ring-offset-0"
                          checked={selectedClientIds.has(customer.id_cliente)}
                          onChange={() => handleSelectClient(customer.id_cliente)}
                          disabled={!customer.correo} // No se puede seleccionar si no tiene correo
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-[#00a2b9]">#{customer.id_cliente}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{customer.nombre}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail size={14} className={customer.correo ? "text-gray-400" : "text-red-400"} />
                          <span className={`text-sm ${!customer.correo ? 'text-red-400 italic' : ''}`}>
                            {customer.correo || "No email"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm">
                            {formatDate(customer.fecha_ultima_promocion)}
                          </span>
                        </div>
                      </td>
                    </tr>
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
  );
}

