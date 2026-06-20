"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

type CartDrawerContextValue = {
  isOpen: boolean
  isCartMutating: boolean
  openDrawer: () => void
  closeDrawer: () => void
  beginCartMutation: () => void
  finishCartMutation: () => void
}

const CartDrawerContext = createContext<CartDrawerContextValue>({
  isOpen: false,
  isCartMutating: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  beginCartMutation: () => {},
  finishCartMutation: () => {},
})

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCartMutating, setIsCartMutating] = useState(false)

  const openDrawer = useCallback(() => setIsOpen(true), [])
  const closeDrawer = useCallback(() => setIsOpen(false), [])
  const beginCartMutation = useCallback(() => setIsCartMutating(true), [])
  const finishCartMutation = useCallback(() => setIsCartMutating(false), [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer()
      }
    }

    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [closeDrawer])

  return (
    <CartDrawerContext.Provider
      value={{
        isOpen,
        isCartMutating,
        openDrawer,
        closeDrawer,
        beginCartMutation,
        finishCartMutation,
      }}
    >
      {children}
    </CartDrawerContext.Provider>
  )
}

export const useCartDrawer = () => useContext(CartDrawerContext)
