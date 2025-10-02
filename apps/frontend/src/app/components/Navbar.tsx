"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart } from "lucide-react"
import { useCart } from "../context/CartContext"

interface NavbarProps {
  onCartClick: () => void
}

export default function Navbar({ onCartClick }: NavbarProps) {
  const { getTotalItems } = useCart()
  const totalItems = getTotalItems()

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo + Brand */}
        <div className="flex items-center space-x-2">
          <Image
            src="/logo-placeholder.png"
            alt="Pharmacy Logo"
            width={32}
            height={32}
          />
          <span className="text-xl font-bold text-gray-800">Pharmacy</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Cart Button */}
          <button
            onClick={onCartClick}
            className="relative p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          <Link
            href="/admin"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}