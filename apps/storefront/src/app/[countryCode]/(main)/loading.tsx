export default function MainRouteLoading() {
  return (
    <div
      className="min-h-[65vh] bg-muse-cream px-[18px] py-12 small:px-8"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="mx-auto max-w-[1400px] animate-pulse">
        <div className="h-3 w-24 rounded-full bg-muse-black/10" />
        <div className="mt-8 h-12 w-full max-w-lg rounded-xl bg-muse-black/10" />
        <div className="mt-4 h-5 w-full max-w-2xl rounded-full bg-muse-black/[0.07]" />
        <div className="mt-12 grid grid-cols-2 gap-3 small:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/5] rounded-[18px] bg-muse-black/[0.07]"
            />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading the next page</span>
    </div>
  )
}
