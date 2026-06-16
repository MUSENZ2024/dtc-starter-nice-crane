"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export type SavedItem = {
  id: string
  title: string
  handle?: string | null
  href: string
  image?: string | null
  price?: string | null
  compareAt?: string | null
  badge?: string | null
  eta?: string | null
  savedAt: string
}

type SavedItemsContextValue = {
  items: SavedItem[]
  count: number
  hydrated: boolean
  isSaved: (id?: string | null) => boolean
  toggleSaved: (item: Omit<SavedItem, "savedAt">) => boolean
  removeSaved: (id: string) => void
  clearSaved: () => void
}

const STORAGE_KEY = "muse:saved-items:v1"

const SavedItemsContext = createContext<SavedItemsContextValue | null>(null)

const parseItems = (raw: string | null): SavedItem[] => {
  if (!raw) {
    return []
  }

  try {
    const value = JSON.parse(raw)

    if (!Array.isArray(value)) {
      return []
    }

    return value.filter(
      (item): item is SavedItem =>
        Boolean(item?.id) &&
        Boolean(item?.title) &&
        Boolean(item?.href) &&
        Boolean(item?.savedAt)
    )
  } catch {
    return []
  }
}

export function SavedItemsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [items, setItems] = useState<SavedItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(parseItems(window.localStorage.getItem(STORAGE_KEY)))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(
      new CustomEvent("muse:saved-items-change", { detail: { count: items.length } })
    )
  }, [hydrated, items])

  const isSaved = useCallback(
    (id?: string | null) => Boolean(id && items.some((item) => item.id === id)),
    [items]
  )

  const toggleSaved = useCallback((item: Omit<SavedItem, "savedAt">) => {
    let nextSaved = true

    setItems((current) => {
      if (current.some((savedItem) => savedItem.id === item.id)) {
        nextSaved = false
        return current.filter((savedItem) => savedItem.id !== item.id)
      }

      return [{ ...item, savedAt: new Date().toISOString() }, ...current]
    })

    return nextSaved
  }, [])

  const removeSaved = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const clearSaved = useCallback(() => setItems([]), [])

  const value = useMemo<SavedItemsContextValue>(
    () => ({
      items,
      count: items.length,
      hydrated,
      isSaved,
      toggleSaved,
      removeSaved,
      clearSaved,
    }),
    [clearSaved, hydrated, isSaved, items, removeSaved, toggleSaved]
  )

  return (
    <SavedItemsContext.Provider value={value}>
      {children}
    </SavedItemsContext.Provider>
  )
}

export function useSavedItems() {
  const context = useContext(SavedItemsContext)

  if (!context) {
    throw new Error("useSavedItems must be used inside SavedItemsProvider")
  }

  return context
}
