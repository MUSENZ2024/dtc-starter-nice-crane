"use client"

import { createContext, useCallback, useContext, useState } from "react"
import type { MarketingSource } from "../types"

type MarketingOverlayContextValue = {
  isMarketingActive: boolean
  marketingSource: MarketingSource
  openMarketingDialog: (source?: MarketingSource) => void
  closeMarketingDialog: () => void
}

const MarketingOverlayContext = createContext<MarketingOverlayContextValue>({
  isMarketingActive: false,
  marketingSource: "welcome_popup",
  openMarketingDialog: () => undefined,
  closeMarketingDialog: () => undefined,
})

export function MarketingOverlayProvider({ children }: { children: React.ReactNode }) {
  const [isMarketingActive, setMarketingActive] = useState(false)
  const [marketingSource, setMarketingSource] = useState<MarketingSource>("welcome_popup")
  const openMarketingDialog = useCallback((source: MarketingSource = "welcome_popup") => {
    setMarketingSource(source)
    setMarketingActive(true)
  }, [])
  const closeMarketingDialog = useCallback(() => setMarketingActive(false), [])

  return (
    <MarketingOverlayContext.Provider value={{ isMarketingActive, marketingSource, openMarketingDialog, closeMarketingDialog }}>
      {children}
    </MarketingOverlayContext.Provider>
  )
}

export const useMarketingOverlay = () => useContext(MarketingOverlayContext)
