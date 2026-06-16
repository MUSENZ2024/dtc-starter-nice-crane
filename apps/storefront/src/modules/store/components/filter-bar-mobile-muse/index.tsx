"use client"

import { HttpTypes } from "@medusajs/types"
import FilterRailMuse from "@modules/store/components/filter-rail-muse"
import SortSelectMuse from "@modules/store/components/sort-select-muse"
import { useState } from "react"

type Brand = { value: string; label: string; count: number }
type Line = Brand & { brand: string }
type Colour = { value: string; hex: string; border?: boolean }
type ShoeSizeGroup = { label: string; sizes: string[] }

type Props = {
  activeFilterCount: number
  brands: Brand[]
  lines: Line[]
  badges: Brand[]
  apparelSizes: string[]
  shoeSizeGroups: ShoeSizeGroup[]
  colours: Colour[]
  categories: HttpTypes.StoreProductCategory[]
  searchParams: Record<string, string | undefined>
}

export default function FilterBarMobileMuse({
  activeFilterCount,
  brands,
  lines,
  badges,
  apparelSizes,
  shoeSizeGroups,
  colours,
  categories,
  searchParams,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[95] flex gap-2 border-t border-muse-border bg-white px-[18px] pb-4 pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] small:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-muse-black px-4 py-3.5 text-[12px] font-bold uppercase tracking-[0.06em] text-muse-cream"
        >
          <FilterIcon />
          Filter
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muse-yellow px-1 text-[11px] font-black text-muse-black">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="relative flex flex-1 items-center justify-center rounded-full bg-white">
          <SortSelectMuse currentSort={searchParams.sortBy ?? "created_at"} />
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[200] bg-black/45 transition-opacity small:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed bottom-0 left-0 top-0 z-[201] flex w-[340px] max-w-[88vw] flex-col bg-muse-cream transition-transform duration-300 small:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-muse-border px-6 py-5">
          <h3 className="text-[17px] font-black tracking-[-0.02em]">Filter</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[28px] leading-none text-muse-text-muted"
            aria-label="Close filters"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <FilterRailMuse
            brands={brands}
            lines={lines}
            badges={badges}
            apparelSizes={apparelSizes}
            shoeSizeGroups={shoeSizeGroups}
            colours={colours}
            categories={categories}
            searchParams={searchParams}
          />
        </div>
        <div className="border-t border-muse-border bg-white px-6 py-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-full bg-muse-black px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em] text-muse-cream"
          >
            View styles
          </button>
        </div>
      </aside>
    </>
  )
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  )
}
