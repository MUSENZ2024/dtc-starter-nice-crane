"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

type Props = {
  showing: number
  total: number
  currentPage: number
  pageSize: number
}

export default function LoadMoreMuse({
  showing,
  total,
  currentPage,
  pageSize,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const totalPages = Math.ceil(total / pageSize)

  if (totalPages <= 1) {
    return null
  }

  const goToPage = (page: number) => {
    const next = new URLSearchParams(params.toString())

    if (page === 1) {
      next.delete("page")
    } else {
      next.set("page", String(page))
    }

    startTransition(() =>
      router.push(`${pathname}?${next.toString()}`, { scroll: false })
    )
  }

  const visiblePages = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, index) => {
      const start = Math.min(
        Math.max(1, currentPage - 2),
        Math.max(1, totalPages - 4)
      )
      return start + index
    }
  )

  return (
    <nav
      className="py-10 text-center"
      aria-label="Product pages"
      aria-busy={isPending}
    >
      <span className="sr-only" role="status" aria-live="polite">
        {isPending ? "Loading product page" : ""}
      </span>
      <p className="mb-5 text-[12.5px] text-muse-text-muted">
        Showing <strong className="text-muse-black">{showing}</strong> of{" "}
        <strong className="text-muse-black">{total}</strong> styles
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1 || isPending}
          aria-label="Previous page"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-muse-input bg-white text-2xl text-muse-black transition hover:border-muse-black disabled:cursor-not-allowed disabled:opacity-35"
        >
          ‹
        </button>
        {visiblePages.map((page) => {
          const active = page === currentPage

          return (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              disabled={isPending}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-bold transition ${
                active
                  ? "border-muse-black bg-muse-black text-muse-cream"
                  : "border-muse-input bg-white text-muse-black hover:border-muse-black"
              }`}
            >
              {page}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages || isPending}
          aria-label="Next page"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-muse-input bg-white text-2xl text-muse-black transition hover:border-muse-black disabled:cursor-not-allowed disabled:opacity-35"
        >
          ›
        </button>
        <span className="ml-2 text-[12.5px] text-muse-text-muted">
          of {totalPages} pages
        </span>
      </div>
    </nav>
  )
}
