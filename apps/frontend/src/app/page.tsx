"use client"

import { useState } from "react"
import Navbar from "./components/Navbar"
import HeroSection from "./components/HeroSection"
import ProductList from "./components/ProductList"
import ShoppingCart from "./components/ShoppingCart"
import WhyChooseUs from "./components/WhyChooseUs"

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false)

  const handleCheckout = () => {
    setIsCartOpen(false)
    // Aquí después implementaremos el modal de orden
    console.log("Proceeding to checkout...")
  }

  return (
    <>
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      <main className="pt-16">
        <HeroSection />
        <ProductList />
        <WhyChooseUs />
      </main>
      <ShoppingCart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
      />
    </>
  )
}