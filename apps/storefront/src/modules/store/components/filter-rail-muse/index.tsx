"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"

import { HttpTypes } from "@medusajs/types"

type Brand = { value: string; label: string; count: number }
type Line = Brand & { brand: string }
type Colour = { value: string; hex: string; border?: boolean }
type ShoeSizeGroup = { label: string; sizes: string[] }

type Props = {
  brands: Brand[]
  lines: Line[]
  badges: Brand[]
  apparelSizes: string[]
  shoeSizeGroups: ShoeSizeGroup[]
  colours: Colour[]
  categories: HttpTypes.StoreProductCategory[]
  searchParams: Record<string, string | undefined>
}

export default function FilterRailMuse({
  brands,
  lines,
  badges,
  apparelSizes,
  shoeSizeGroups,
  colours,
  categories,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [activeShoeGroup, setActiveShoeGroup] = useState(
    shoeSizeGroups[0]?.label ?? ""
  )

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString())

      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }

      next.delete("page")
      router.push(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [params, pathname, router]
  )

  const toggleMulti = useCallback(
    (key: string, value: string) => {
      const current = (params.get(key) ?? "").split(",").filter(Boolean)
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]

      setParam(key, next.length ? next.join(",") : null)
    },
    [params, setParam]
  )

  const toggleBrand = useCallback(
    (brand: string) => {
      const next = new URLSearchParams(params.toString())
      const currentBrands = (next.get("brand") ?? "").split(",").filter(Boolean)
      const brandActive = currentBrands.includes(brand)
      const nextBrands = brandActive
        ? currentBrands.filter((item) => item !== brand)
        : [...currentBrands, brand]

      if (nextBrands.length) {
        next.set("brand", nextBrands.join(","))
      } else {
        next.delete("brand")
      }

      if (brandActive) {
        const currentLines = (next.get("line") ?? "").split(",").filter(Boolean)
        const nextLines = currentLines.filter((line) => {
          const lineBrand = lines.find((item) => item.value === line)?.brand
          return lineBrand !== brand
        })

        if (nextLines.length) {
          next.set("line", nextLines.join(","))
        } else {
          next.delete("line")
        }
      }

      next.delete("page")
      router.push(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [lines, params, pathname, router]
  )

  const toggleLine = useCallback(
    (line: Line) => {
      const next = new URLSearchParams(params.toString())
      const currentLines = (next.get("line") ?? "").split(",").filter(Boolean)
      const lineActive = currentLines.includes(line.value)
      const nextLines = lineActive
        ? currentLines.filter((item) => item !== line.value)
        : [...currentLines, line.value]

      if (nextLines.length) {
        next.set("line", nextLines.join(","))
      } else {
        next.delete("line")
      }

      const currentBrands = (next.get("brand") ?? "").split(",").filter(Boolean)
      if (!lineActive && !currentBrands.includes(line.brand)) {
        next.set("brand", [...currentBrands, line.brand].join(","))
      }

      next.delete("page")
      router.push(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [params, pathname, router]
  )

  const activeStock = params.get("stock")
  const activeBrands = (params.get("brand") ?? "").split(",").filter(Boolean)
  const activeLines = (params.get("line") ?? "").split(",").filter(Boolean)
  const activeBadges = (params.get("badge") ?? "").split(",").filter(Boolean)
  const activeSizes = (params.get("size") ?? "").split(",").filter(Boolean)
  const activeColours = (params.get("colour") ?? "").split(",").filter(Boolean)
  const activeCats = (params.get("cat") ?? "").split(",").filter(Boolean)
  const maxPrice = params.get("maxPrice")
  const hasFilters = Boolean(
    activeStock ||
      activeBrands.length ||
      activeLines.length ||
      activeBadges.length ||
      activeSizes.length ||
      activeColours.length ||
      activeCats.length ||
      maxPrice
  )

  const clearAll = () => {
    const next = new URLSearchParams(params.toString())

    ;[
      "stock",
      "brand",
      "line",
      "badge",
      "cat",
      "size",
      "colour",
      "maxPrice",
      "minPrice",
    ].forEach((key) => next.delete(key))
    next.delete("page")
    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  return (
    <div className="sticky top-[88px] overflow-hidden rounded-[20px] border border-muse-border bg-muse-cream-warm">
      <div className="flex items-center justify-between border-b border-muse-border px-5 py-4">
        <span className="text-[13px] font-extrabold uppercase tracking-[0.1em]">
          Filter
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11.5px] font-bold uppercase tracking-wider text-muse-orange"
          >
            Clear all
          </button>
        )}
      </div>

      <FilterGroup title="Availability" defaultOpen>
        <div className="flex flex-col gap-2">
          {[
            {
              label: "NZ Stock",
              sub: "Ships in 1-3 days",
              value: "nz-stock",
              colour: "bg-muse-green",
            },
            {
              label: "Standard Delivery",
              sub: "13-16 days",
              value: "standard-delivery",
              colour: "bg-muse-orange",
            },
          ].map((option) => {
            const active = activeStock === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setParam("stock", active ? null : option.value)}
                className={`flex items-center justify-between rounded-xl border bg-white px-3.5 py-3 text-left transition ${
                  active ? "border-muse-black" : "border-muse-input hover:border-muse-black"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-full ${option.colour}`} />
                  <span>
                    <span className="block text-[12.5px] font-semibold">
                      {option.label}
                    </span>
                    <span className="block text-[10.5px] text-muse-text-muted">
                      {option.sub}
                    </span>
                  </span>
                </span>
                <CheckDot active={active} />
              </button>
            )
          })}
        </div>
      </FilterGroup>

      {!!categories.length && (
        <FilterGroup title="Category" defaultOpen>
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <CheckRow
                key={category.id}
                label={category.name}
                active={activeCats.includes(category.id)}
                onClick={() => toggleMulti("cat", category.id)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Size" defaultOpen>
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-muse-text-light">
            Apparel
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {apparelSizes.map((size) => {
              const active = activeSizes.includes(size)

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleMulti("size", size)}
                  className={`rounded-lg border py-2.5 text-center text-[11.5px] font-bold transition ${
                    active
                      ? "border-muse-black bg-muse-black text-muse-cream"
                      : "border-muse-input bg-white text-muse-black hover:border-muse-black"
                  }`}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>

        {!!shoeSizeGroups.length && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muse-text-light">
                Footwear
              </p>
              <div className="relative">
                <select
                  value={activeShoeGroup}
                  onChange={(event) => setActiveShoeGroup(event.target.value)}
                  className="h-8 cursor-pointer appearance-none rounded-full border border-muse-input bg-white pl-4 pr-8 text-[11px] font-bold text-muse-black outline-none transition focus:border-muse-black"
                  aria-label="Footwear size system"
                >
                  {shoeSizeGroups.map((group) => (
                    <option key={group.label} value={group.label}>
                      {group.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] leading-none text-muse-text-muted">
                  ▾
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {shoeSizeGroups
                .find((group) => group.label === activeShoeGroup)
                ?.sizes.map((size) => {
                  const active = activeSizes.includes(size)
                  const label = size.replace(/^(USM|USW|UK)\s?/, "")

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleMulti("size", size)}
                      title={size}
                      className={`rounded-lg border py-2.5 text-center text-[11.5px] font-bold transition ${
                        active
                          ? "border-muse-black bg-muse-black text-muse-cream"
                          : "border-muse-input bg-white text-muse-black hover:border-muse-black"
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
            </div>
          </div>
        )}
      </FilterGroup>

      <FilterGroup title="Brand">
        <div className="flex flex-col gap-1.5">
          {brands.map((brand) => {
            const brandLines = lines.filter((line) => line.brand === brand.value)
            const brandActive = activeBrands.includes(brand.value)
            const hasActiveLine = brandLines.some((line) =>
              activeLines.includes(line.value)
            )
            const expanded = brandActive || hasActiveLine

            return (
              <div key={brand.value} className="rounded-xl bg-white/60">
                <CheckRow
                  label={brand.label}
                  count={brand.count}
                  active={brandActive}
                  onClick={() => toggleBrand(brand.value)}
                  suffix={brandLines.length ? expanded ? "▴" : "▾" : undefined}
                />
                {expanded && !!brandLines.length && (
                  <div className="ml-7 mt-1 flex flex-col gap-1.5 border-l border-muse-border pb-2 pl-3">
                    {brandLines.map((line) => (
                      <CheckRow
                        key={line.value}
                        label={line.label}
                        count={line.count}
                        active={activeLines.includes(line.value)}
                        onClick={() => toggleLine(line)}
                        compact
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </FilterGroup>

      {!!badges.length && (
        <FilterGroup title="Drop / Status">
          <div className="flex flex-col gap-2">
            {badges.map((badge) => (
              <CheckRow
                key={badge.value}
                label={badge.label}
                count={badge.count}
                active={activeBadges.includes(badge.value)}
                onClick={() => toggleMulti("badge", badge.value)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Colour">
        <div className="flex flex-wrap gap-2">
          {colours.map((colour) => {
            const active = activeColours.includes(colour.value)

            return (
              <button
                key={colour.value}
                type="button"
                title={colour.value}
                aria-label={colour.value}
                onClick={() => toggleMulti("colour", colour.value)}
                className={`h-7 w-7 rounded-full transition hover:scale-110 ${
                  active ? "ring-2 ring-muse-black ring-offset-2" : ""
                } ${colour.border ? "border border-muse-border" : ""}`}
                style={{ backgroundColor: colour.hex }}
              />
            )
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="flex flex-col gap-1.5">
          {[
            { label: "Under $100", value: "100" },
            { label: "Under $150", value: "150" },
            { label: "Under $200", value: "200" },
            { label: "Under $250", value: "250" },
          ].map((range) => {
            const active = maxPrice === range.value

            return (
              <button
                key={range.value}
                type="button"
                onClick={() => setParam("maxPrice", active ? null : range.value)}
                className={`flex items-center gap-2.5 py-1 text-[12.5px] font-medium transition ${
                  active
                    ? "font-bold text-muse-black"
                    : "text-muse-text-muted hover:text-muse-black"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    active ? "border-muse-black" : "border-muse-input"
                  }`}
                >
                  {active && <span className="block h-2 w-2 rounded-full bg-muse-black" />}
                </span>
                {range.label}
              </button>
            )
          })}
        </div>
      </FilterGroup>
    </div>
  )
}

function FilterGroup({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details open={defaultOpen} className="group border-b border-muse-border last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-[12.5px] font-bold text-muse-black transition hover:bg-muse-cream-deep">
        {title}
        <span className="text-[11px] text-muse-text-muted transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="px-5 pb-4 pt-1">{children}</div>
    </details>
  )
}

function CheckRow({
  label,
  count,
  active,
  onClick,
  suffix,
  compact = false,
}: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
  suffix?: string
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-1.5 text-left transition hover:bg-white ${
        compact ? "py-0.5" : "py-1"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <span
          className={`flex h-[18px] w-[18px] items-center justify-center rounded-md border transition ${
            active ? "border-muse-black bg-muse-black" : "border-muse-input bg-white"
          }`}
        >
          {active && <span className="text-[10px] leading-none text-white">✓</span>}
        </span>
        <span
          className={`font-medium text-muse-text ${
            compact ? "text-[12px]" : "text-[12.5px]"
          }`}
        >
          {label}
        </span>
      </span>
      <span className="flex items-center gap-2 text-[11px] text-muse-text-light">
        {typeof count === "number" && <span>{count}</span>}
        {suffix && <span className="text-[10px] text-muse-text-muted">{suffix}</span>}
      </span>
    </button>
  )
}

function CheckDot({ active }: { active: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
        active ? "border-muse-black bg-muse-black" : "border-muse-input"
      }`}
    >
      {active && <span className="text-[10px] text-white">✓</span>}
    </span>
  )
}
