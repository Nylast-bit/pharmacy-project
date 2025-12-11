"use client"

import { useState } from "react"
import Navbar from "./components/Navbar"
import HeroSection from "./components/HeroSection"
import ProductList from "./components/ProductList"
import ShoppingCart from "./components/ShoppingCart"
import CheckoutModal from "./components/CheckoutModal"
import WhyChooseUs from "./components/WhyChooseUs"
import ContactForm from "./components/ContactForm"
import Footer from "./components/Footer"

function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  const handleCheckout = () => {
    setIsCartOpen(false)
    setIsCheckoutOpen(true)
  }

  return (
    <>
      <Navbar onCartClick={() => setIsCartOpen(true)} />
      <main className="pt-16">
        <HeroSection />
        <ProductList />
        <WhyChooseUs />
        <ContactForm/>
        <Footer/>
      </main>

      {/* Carrito lateral */}
      <ShoppingCart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
      />

      {/* Modal de checkout con pasos */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  )
}

export default Home;

