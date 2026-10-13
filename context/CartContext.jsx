import React, { createContext, useCallback, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])

  const addToCart = useCallback((product) => {
    setCartItems((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l
        )
      }
      return [...prev, { product, qty: 1 }]
    })
  }, [])

  const removeLine = useCallback((productId) => {
    setCartItems((prev) => prev.filter((l) => l.product.id !== productId))
  }, [])

  const adjustQty = useCallback((productId, delta) => {
    setCartItems((prev) => {
      const line = prev.find((l) => l.product.id === productId)
      if (!line) return prev
      const nextQty = line.qty + delta
      if (nextQty <= 0) return prev.filter((l) => l.product.id !== productId)
      return prev.map((l) => (l.product.id === productId ? { ...l, qty: nextQty } : l))
    })
  }, [])

  const clearCart = useCallback(() => setCartItems([]), [])

  return (
    <CartContext.Provider
      value={{ cartItems, setCartItems, addToCart, removeLine, adjustQty, clearCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider')
  }
  return ctx
}
