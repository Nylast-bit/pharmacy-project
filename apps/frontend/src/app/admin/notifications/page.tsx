"use client";

import { useEffect, useState, useMemo, FormEvent, ChangeEvent } from "react";
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
  AlertCircle,
  CheckCircle2,
  RefreshCcw,
  MailPlus, // NUEVO: Icono para el botón "Upload Email"
  X,         // NUEVO: Icono para cerrar el modal
  FileText, // NUEVO: Icono para la subida de archivo
  ClipboardPaste,
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



function NotificationsPage() {
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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pastedEmails, setPastedEmails] = useState("");
  const [uploadedEmailsList, setUploadedEmailsList] = useState<string[]>([]);
  const [emailListWarning, setEmailListWarning] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');


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
  
  /**
   * Procesa un string (de un archivo o textarea) y extrae los correos.
   */
  const parseEmailText = (text: string) => {
    // Regex para separar por saltos de línea, comas, espacios o punto y coma
    const emails = text
      .split(/[\n\s,;]+/) // Divide por múltiples separadores
      .map(email => email.trim())
      .filter(email => email.length > 0 && email.includes('@')); // Filtra válidos
    
    const uniqueEmails = Array.from(new Set(emails)); // Elimina duplicados
    setUploadedEmailsList(uniqueEmails);

    // Establece la advertencia si son más de 100
    if (uniqueEmails.length > 100) {
      setEmailListWarning(`Warning: You have added ${uniqueEmails.length} emails. This is more than 100.`);
    } else {
      setEmailListWarning(null);
    }
  };

  const handlePastedEmailsChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPastedEmails(e.target.value);
    parseEmailText(e.target.value); // Procesa en tiempo real
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setPastedEmails(text); // Pone el contenido del archivo en el textarea
      parseEmailText(text); // Procesa el texto
    };
    reader.readAsText(file);
    e.target.value = ""; // Resetea el input
  };

  const handleSendToCustomList = async () => {
    // 1. Validar formulario principal
    if (!subject || !htmlBody) {
      setMessage({ type: 'error', text: 'Subject and Email Body are required.' });
      setIsUploadModalOpen(false); 
      return;
    }
    // 2. Validar lista de correos
    if (uploadedEmailsList.length === 0) {
      setEmailListWarning('No valid emails were found to send to.');
      return;
    }
    // 3. Advertir si son > 100 (¡Cumpliendo tu requisito!)
    if (uploadedEmailsList.length > 100) {
      if (typeof window !== 'undefined' && !window.confirm(`${emailListWarning} Do you want to proceed anyway?`)) {
        return; // El usuario canceló
      }
    }

  await sendApiRequest(
        'send-to-emails-list', // Asume un nuevo endpoint en tu API
        { 
          emails: uploadedEmailsList, // Envía el array de correos
          subject, 
          htmlBody 
        },
        `Email sent to ${uploadedEmailsList.length} custom emails.`
      );

      // 5. Limpiar y cerrar modal
      setIsUploadModalOpen(false);
      setUploadedEmailsList([]);
      setPastedEmails("");
      setEmailListWarning(null);
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
                onClick={() => setIsUploadModalOpen(true)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all disabled:bg-gray-400"
              >
                Upload Email List
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
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#00a2b9] to-[#00c4d4] p-6">
          <button
            onClick={() => setIsUploadModalOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center text-white">
            <div className="bg-white/20 rounded-2xl backdrop-blur-sm">
              <MailPlus size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Upload Email List</h3>
              <p className="text-white/90 text-sm mt-1">Import your custom recipients</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          
          {/* Opción 1: Copy & Paste */}
          <div className="space-y-3">
            <label 
              htmlFor="pastedEmails" 
              className="flex items-center gap-2 text-sm font-semibold text-gray-700"
            >
              <div className="bg-[#00a2b9]/10 p-1.5 rounded-lg">
                <ClipboardPaste size={16} className="text-[#00a2b9]" />
              </div>
              Paste Your Emails
            </label>
            
            <textarea
              id="pastedEmails"
              rows={6}
              value={pastedEmails}
              onChange={handlePastedEmailsChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#00a2b9] focus:ring-4 focus:ring-[#00a2b9]/10 transition-all duration-200 resize-none text-sm placeholder:text-gray-400"
              placeholder="Paste emails separated by commas, spaces, or line breaks&#10;&#10;Example:&#10;john@company.com, jane@company.com&#10;mike@example.com"
            />
          </div>
          
          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm font-medium text-gray-500">OR</span>
            </div>
          </div>
          
          {/* Opción 2: Upload File */}
          <div className="space-y-3">
            <label 
              htmlFor="fileUpload" 
              className="flex items-center gap-2 text-sm font-semibold text-gray-700"
            >
              <div className="bg-[#00a2b9]/10 p-1.5 rounded-lg">
                <FileText size={16} className="text-[#00a2b9]" />
              </div>
              Upload .txt File
            </label>
            
            <div className="relative">
              <input
                id="fileUpload"
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="fileUpload"
                className="flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#00a2b9] hover:bg-[#00a2b9]/5 transition-all duration-200 cursor-pointer group"
              >
                <FileText size={20} className="text-gray-400 group-hover:text-[#00a2b9] transition-colors" />
                <span className="text-sm text-gray-600 group-hover:text-[#00a2b9] font-medium transition-colors">
                  {fileName || 'Click to browse or drag & drop'}
                </span>
              </label>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 border border-gray-200">
            <div className="flex items-start gap-3">
              {uploadedEmailsList.length > 0 ? (
                <CheckCircle2 size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium">
                  {uploadedEmailsList.length > 0 ? (
                    <>
                      Found <span className="text-[#00a2b9] font-bold text-lg">{uploadedEmailsList.length}</span> valid email{uploadedEmailsList.length !== 1 ? 's' : ''}
                    </>
                  ) : (
                    'No emails detected yet'
                  )}
                </p>
                
                {emailListWarning && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{emailListWarning}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-3 p-6 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(false)}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSendToCustomList}
            disabled={isSubmitting || uploadedEmailsList.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#00a2b9] to-[#00c4d4] rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-200"
          >
            <Send size={18} />
            {isSubmitting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Sending...
              </>
            ) : (
              `Send to ${uploadedEmailsList.length} Email${uploadedEmailsList.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
      )}
    </div>
  );
}

export default NotificationsPage;