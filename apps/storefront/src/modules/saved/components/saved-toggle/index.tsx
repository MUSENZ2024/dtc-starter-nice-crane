"use client"

import { SavedItem, useSavedItems } from "@lib/context/saved-items-context"

type Props = {
  item: Omit<SavedItem, "savedAt">
  className?: string
  iconClassName?: string
  label?: string
  showText?: boolean
}

export default function SavedToggle({
  item,
  className = "",
  iconClassName = "h-4 w-4",
  label,
  showText = false,
}: Props) {
  const { isSaved, toggleSaved } = useSavedItems()
  const saved = isSaved(item.id)

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggleSaved(item)
      }}
      className={className}
      aria-label={label ?? (saved ? "Remove from saved items" : "Save item")}
      aria-pressed={saved}
    >
      <HeartIcon saved={saved} className={iconClassName} />
      {showText && (
        <span>{saved ? "Saved" : "Save item"}</span>
      )}
    </button>
  )
}

export function HeartIcon({
  saved,
  className = "h-4 w-4",
}: {
  saved: boolean
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} stroke-current stroke-2 ${
        saved ? "fill-current" : "fill-none"
      }`}
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
