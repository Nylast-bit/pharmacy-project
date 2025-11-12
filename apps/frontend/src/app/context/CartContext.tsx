"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

export interface CartItem {
  id_producto: number
  nombre: string
  descripcion?: string | null
  precio: number
  imagen_url?: string | null
  quantity: number
}

// --- 1. DEFINIMOS LA TARIFA FIJA ---
// La exportamos para que otros componentes (como el resumen del carrito)
// puedan leerla y mostrarla, sabiendo que no puede cambiar.
export const SHIPPING_FEE = 60

// --- 2. SIMPLIFICAMOS LA INTERFAZ ---
// Eliminamos las funciones de añadir/quitar envío.
// Añadimos 'shippingFee' para que los componentes puedan LEER la tarifa.
interface CartContextType {
  cart: CartItem[]
  shippingFee: number // <-- Es solo de lectura
  addToCart: (product: Omit<CartItem, "quantity">) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  // --- 3. ELIMINAMOS EL ESTADO (useState) DE ENVÍO ---
  // (Ya no es necesario, es una constante)

  const addToCart = (product: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id_producto === product.id_producto)
      
      if (existing) {
        return prev.map((item) =>
          item.id_producto === product.id_producto
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id_producto !== id))
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    
    setCart((prev) =>
      prev.map((item) =>
        item.id_producto === id ? { ...item, quantity } : item
      )
    )
  }

  // clearCart ahora solo limpia el carrito
  const clearCart = () => {
    setCart([])
  }

  // --- 4. ELIMINAMOS LAS FUNCIONES addShipping y removeShipping ---
  // (No se pueden añadir ni cambiar, como dijiste)

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  // --- 5. LÓGICA CLAVE EN getTotalPrice ---
  const getTotalPrice = () => {
    const itemsTotal = cart.reduce((sum, item) => sum + item.precio * item.quantity, 0)
    
    // Si el total de artículos es 0, el precio total es 0.
    // Si hay CUALQUIER artículo, se suma la tarifa fija de envío.
    if (itemsTotal === 0) {
      return 0
    }

    return itemsTotal + SHIPPING_FEE
  }

  return (
    <CartContext.Provider
      // --- 6. AÑADIMOS LA TARIFA FIJA AL CONTEXTO ---
      value={{
        cart,
        shippingFee: SHIPPING_FEE, // <-- Pasa la constante
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }
  return context
}