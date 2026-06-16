"use client"

import { useSavedItems } from "@lib/context/saved-items-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HeartIcon } from "@modules/saved/components/saved-toggle"

export default function NavSavedLink() {
  const { count, hydrated } = useSavedItems()
  const hasItems = hydrated && count > 0

  return (
    <LocalizedClientLink
      href="/saved"
      className={`relative flex h-9 w-9 items-center justify-center rounded-full transition ${
        hasItems
          ? "bg-[#C8D050] text-[#0A0A0A]"
          : "text-white/65 hover:text-[#C8D050]"
      }`}
      aria-label={
        hasItems ? `${count} saved ${count === 1 ? "item" : "items"}` : "Saved items"
      }
      data-testid="nav-saved-link"
    >
      <HeartIcon saved={hasItems} className="h-[18px] w-[18px]" />
      {hasItems && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0A0A0A] px-1 text-[9px] font-black text-[#C8D050]">
          {count}
        </span>
      )}
    </LocalizedClientLink>
  )
}
