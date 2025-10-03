"use client"

import Image from "next/image"
import { Mail, Phone, MapPin } from "lucide-react"

export default function Footer() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Column 1 - Logo & Tagline */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo-placeholder.png"
                alt="Pharmacy Logo"
                width={40}
                height={40}
              />
              <span className="text-xl font-bold text-white">Pharmacy</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Find the best products at the best price, with the confidence you deserve.
            </p>
          </div>

          {/* Column 2 - Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Contact Information
            </h3>
            <div className="space-y-3">
              <a
                href="mailto:info@pharmacy.com"
                className="flex items-center gap-3 hover:text-[#00d4e8] transition-colors"
              >
                <Mail className="w-5 h-5 text-[#00d4e8]" />
                <span>info@pharmacy.com</span>
              </a>
              <a
                href="tel:+15551234567"
                className="flex items-center gap-3 hover:text-[#00d4e8] transition-colors"
              >
                <Phone className="w-5 h-5 text-[#00d4e8]" />
                <span>+1 (555) 123-4567</span>
              </a>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#00d4e8] flex-shrink-0 mt-1" />
                <span>123 Health Street, Medical District, NY 10001</span>
              </div>
            </div>
          </div>

          {/* Column 3 - Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Quick Links
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => scrollToSection("hero")}
                className="block hover:text-[#00d4e8] transition-colors text-left"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("product-list-top")}
                className="block hover:text-[#00d4e8] transition-colors text-left"
              >
                Products
              </button>
              <button
                onClick={() => scrollToSection("contact-form")}
                className="block hover:text-[#00d4e8] transition-colors text-left"
              >
                Contact
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Pharmacy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}