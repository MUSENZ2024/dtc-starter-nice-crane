"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

const FILTER_KEYS = [
  "stock",
  "brand",
  "line",
  "badge",
  "cat",
  "size",
  "colour",
  "maxPrice",
] as const

const formatValue = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

export default function ActiveFilterChips({
  searchParams,
  categoryLabels = {},
  tagLabels = {},
}: {
  searchParams: Record<string, string | undefined>
  categoryLabels?: Record<string, string>
  tagLabels?: Record<string, string>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const chips = FILTER_KEYS.flatMap((key) => {
    const value = searchParams[key]

    if (!value) {
      return []
    }

    return value
      .split(",")
      .filter(Boolean)
      .map((item) => ({ key, value: item }))
  })

  if (!chips.length) {
    return null
  }

  const remove = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    const current = (next.get(key) ?? "").split(",").filter(Boolean)
    const updated = current.filter((item) => item !== value)

    if (updated.length) {
      next.set(key, updated.join(","))
    } else {
      next.delete(key)
    }

    next.delete("page")
    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  const clearAll = () => {
    const next = new URLSearchParams(params.toString())

    FILTER_KEYS.forEach((key) => next.delete(key))
    next.delete("page")
    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map(({ key, value }) => (
        <button
          key={`${key}-${value}`}
          type="button"
          onClick={() => remove(key, value)}
          className="flex items-center gap-1.5 rounded-full bg-muse-black px-3 py-1.5 text-[11.5px] font-bold text-muse-cream transition hover:bg-muse-orange"
        >
          {key === "maxPrice"
            ? `Under $${value}`
            : key === "cat"
            ? categoryLabels[value] ?? formatValue(value)
            : key === "brand" || key === "line" || key === "badge"
            ? tagLabels[value] ?? formatValue(value)
            : formatValue(value)}
          <span className="text-sm leading-none opacity-70">×</span>
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="text-[11.5px] font-bold uppercase tracking-wider text-muse-orange"
      >
        Clear all
      </button>
    </div>
  )
}
