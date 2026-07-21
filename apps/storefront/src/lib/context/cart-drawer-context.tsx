"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

export type OptimisticCartItem = {
  id: string
  variantId: string
  productTitle: string
  productHandle?: string | null
  variantTitle?: string | null
  thumbnail?: string | null
  quantity: number
  baseQuantity: number
  unitPrice: number
  currencyCode: string
  fulfilmentShortLabel?: string
  fulfilmentDotClassName?: string
}

type OptimisticCartInput = Omit<OptimisticCartItem, "id" | "baseQuantity">

type CartSnapshotLine = {
  variantId?: string | null
  quantity: number
}

type CartDrawerContextValue = {
  isOpen: boolean
  isCartMutating: boolean
  cartSubtotal: number | null
  optimisticItems: OptimisticCartItem[]
  openDrawer: () => void
  closeDrawer: () => void
  beginCartMutation: (item?: OptimisticCartInput) => void
  finishCartMutation: () => void
  removeOptimisticItem: (variantId: string) => void
  registerCartSnapshot: (lines: CartSnapshotLine[]) => void
  registerCartSubtotal: (subtotal: number) => void
}

const CartDrawerContext = createContext<CartDrawerContextValue>({
  isOpen: false,
  isCartMutating: false,
  cartSubtotal: null,
  optimisticItems: [],
  openDrawer: () => {},
  closeDrawer: () => {},
  beginCartMutation: () => {},
  finishCartMutation: () => {},
  removeOptimisticItem: () => {},
  registerCartSnapshot: () => {},
  registerCartSubtotal: () => {},
})

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCartMutating, setIsCartMutating] = useState(false)
  const [cartSubtotal, setCartSubtotal] = useState<number | null>(null)
  const [optimisticItems, setOptimisticItems] = useState<OptimisticCartItem[]>([])
  const cartQuantitySnapshot = useRef<Map<string, number>>(new Map())

  const openDrawer = useCallback(() => setIsOpen(true), [])
  const closeDrawer = useCallback(() => setIsOpen(false), [])
  const beginCartMutation = useCallback((item?: OptimisticCartInput) => {
    setIsCartMutating(true)

    if (!item) {
      return
    }

    const baseQuantity = cartQuantitySnapshot.current.get(item.variantId) ?? 0

    setOptimisticItems((current) => {
      const existing = current.find(
        (optimisticItem) => optimisticItem.variantId === item.variantId
      )

      if (existing) {
        return current.map((optimisticItem) =>
          optimisticItem.variantId === item.variantId
            ? {
                ...optimisticItem,
                quantity: optimisticItem.quantity + item.quantity,
              }
            : optimisticItem
        )
      }

      return [
        ...current,
        {
          ...item,
          baseQuantity,
          id: `${item.variantId}-${Date.now()}`,
        },
      ]
    })
  }, [])
  const finishCartMutation = useCallback(() => setIsCartMutating(false), [])
  const removeOptimisticItem = useCallback((variantId: string) => {
    setOptimisticItems((current) =>
      current.filter((item) => item.variantId !== variantId)
    )
  }, [])
  const registerCartSnapshot = useCallback((lines: CartSnapshotLine[]) => {
    const nextSnapshot = new Map<string, number>()

    lines.forEach((line) => {
      if (line.variantId) {
        nextSnapshot.set(line.variantId, line.quantity)
      }
    })

    cartQuantitySnapshot.current = nextSnapshot
    setOptimisticItems((current) =>
      current.filter((item) => {
        const currentQuantity = nextSnapshot.get(item.variantId) ?? 0
        const targetQuantity = Math.max(
          0,
          item.baseQuantity + item.quantity
        )

        return currentQuantity !== targetQuantity
      })
    )
  }, [])
  const registerCartSubtotal = useCallback((subtotal: number) => {
    setCartSubtotal(subtotal)
  }, [])

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
        cartSubtotal,
        optimisticItems,
        openDrawer,
        closeDrawer,
        beginCartMutation,
        finishCartMutation,
        removeOptimisticItem,
        registerCartSnapshot,
        registerCartSubtotal,
      }}
    >
      {children}
    </CartDrawerContext.Provider>
  )
}

export const useCartDrawer = () => useContext(CartDrawerContext)
