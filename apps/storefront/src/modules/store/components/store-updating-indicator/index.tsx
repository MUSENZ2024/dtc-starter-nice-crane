type Props = {
  active: boolean
  label?: string
}

export default function StoreUpdatingIndicator({
  active,
  label = "Updating products",
}: Props) {
  if (!active) {
    return null
  }

  return (
    <div
      className="fixed inset-x-0 top-8 z-[240] flex justify-center px-4 pointer-events-none"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="mt-3 flex items-center gap-2.5 rounded-full bg-muse-black px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.09em] text-muse-cream shadow-xl">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-muse-yellow/35 border-t-muse-yellow"
          aria-hidden="true"
        />
        {label}
      </div>
    </div>
  )
}
