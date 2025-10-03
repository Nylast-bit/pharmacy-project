"use client"

import { useState } from "react"
import { Send, Check } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    correo: "",
    telefono: "",
    direccion: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const customerData = {
        nombre: `${formData.firstName} ${formData.lastName}`.trim(),
        correo: formData.correo,
        telefono: formData.telefono || undefined,
        direccion: formData.direccion || undefined,
      }

      const res = await fetch(`${API_BASE_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error creating customer")
      }

      setSuccess(true)
      setFormData({
        firstName: "",
        lastName: "",
        correo: "",
        telefono: "",
        direccion: "",
      })

      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white" id="contact-form">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4">Get in Touch</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Have questions about our products or services? Fill out the form below and we'll get back to you as soon as possible.
        </p>

        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left side - Pharmaceutical Icon/Image */}
            <div className="bg-gradient-to-br from-[#00a2b9] to-[#008899] p-12 flex items-center justify-center">
              <div className="text-center">
                {/* Pharmaceutical Icon - You can replace this with an actual image */}
                <div className="w-64 h-64 mx-auto mb-6 relative">
                  <svg
                    viewBox="0 0 200 200"
                    className="w-full h-full text-white/90"
                    fill="currentColor"
                  >
                    {/* Mortar and Pestle Icon */}
                    <path d="M100,20 L100,80 M80,80 L120,80 M70,80 C70,80 65,120 70,140 C75,160 90,170 100,170 C110,170 125,160 130,140 C135,120 130,80 130,80 Z" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      fill="none"
                      strokeLinecap="round"
                    />
                    <ellipse cx="100" cy="80" rx="30" ry="8" fill="currentColor" opacity="0.3" />
                    <circle cx="100" cy="30" r="8" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Professional Care
                </h3>
                <p className="text-white/80">
                  Our pharmaceutical experts are here to help you with any questions or concerns.
                </p>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="p-12">
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-800">
                    Thank you for contacting us! We'll be in touch soon.
                  </span>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a2b9] focus:border-transparent transition"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a2b9] focus:border-transparent transition"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="correo"
                    required
                    value={formData.correo}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a2b9] focus:border-transparent transition"
                    placeholder="john.doe@example.com"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a2b9] focus:border-transparent transition"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="direccion"
                    rows={3}
                    value={formData.direccion}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a2b9] focus:border-transparent transition resize-none"
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00a2b9] hover:bg-[#008899] text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>

                <p className="text-sm text-gray-500 text-center">
                  By submitting this form, you agree to our{" "}
                  <a href="#" className="text-[#00a2b9] hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}