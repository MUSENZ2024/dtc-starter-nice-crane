"use client"

import { SortOptions } from "@lib/data/products.types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const SORT_OPTIONS: { value: SortOptions; label: string }[] = [
  { value: "best_sellers", label: "Best sellers" },
  { value: "created_at", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "ships_soonest", label: "Ships soonest" },
]

export default function SortSelectMuse({ currentSort }: { currentSort: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const current =
    SORT_OPTIONS.find((option) => option.value === currentSort) ??
    SORT_OPTIONS[1]

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const handleChange = (value: SortOptions) => {
    const next = new URLSearchParams(params.toString())

    next.set("sortBy", value)
    next.delete("page")
    setOpen(false)
    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  return (
    <div ref={menuRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 min-w-[164px] items-center justify-between gap-3 rounded-full border border-muse-input bg-white px-4 text-left text-[12.5px] font-semibold text-muse-black transition hover:border-muse-black focus:border-muse-black focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{current.label}</span>
        <span className="text-[10px] text-muse-text-muted">▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-[90] w-[220px] overflow-hidden rounded-xl border border-muse-black/10 bg-muse-black py-1.5 text-muse-cream shadow-xl"
        >
          {SORT_OPTIONS.map((option) => {
            const active = option.value === current.value

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => handleChange(option.value)}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-[12.5px] font-semibold transition hover:bg-white/10 ${
                  active ? "text-muse-yellow" : "text-muse-cream"
                }`}
              >
                {option.label}
                {active && <span>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
