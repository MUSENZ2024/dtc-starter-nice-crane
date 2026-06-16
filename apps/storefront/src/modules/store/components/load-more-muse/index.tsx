"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

type Props = {
  showing: number
  total: number
  hasMore: boolean
  currentPage: number
  pageSize: number
}

export default function LoadMoreMuse({
  showing,
  total,
  hasMore,
  currentPage,
  pageSize,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const pct = total ? Math.round((showing / total) * 100) : 0

  if (!hasMore && showing >= total) {
    return null
  }

  const loadMore = () => {
    const next = new URLSearchParams(params.toString())

    next.set("page", String(currentPage + 1))
    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  const goBack = () => {
    const next = new URLSearchParams(params.toString())

    if (currentPage <= 2) {
      next.delete("page")
    } else {
      next.set("page", String(currentPage - 1))
    }

    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  return (
    <div className="py-10 text-center">
      <p className="mb-3 text-[12.5px] text-muse-text-muted">
        Showing <strong className="text-muse-black">{showing}</strong> of{" "}
        <strong className="text-muse-black">{total}</strong> styles
      </p>
      <div className="mx-auto mb-5 h-1 w-48 overflow-hidden rounded-full bg-muse-border">
        <div
          className="h-full rounded-full bg-muse-black transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-2.5">
      {currentPage > 1 && (
        <button
          type="button"
          onClick={goBack}
          className="rounded-full border border-muse-input bg-white px-7 py-4 text-[13px] font-bold uppercase tracking-widest text-muse-black transition hover:-translate-y-0.5 hover:border-muse-black"
        >
          Previous {pageSize}
        </button>
      )}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          className="rounded-full bg-muse-black px-10 py-4 text-[13px] font-bold uppercase tracking-widest text-muse-cream transition hover:-translate-y-0.5 hover:bg-muse-orange"
        >
          Load more styles →
        </button>
      )}
      </div>
    </div>
  )
}
