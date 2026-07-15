export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#1A1A1A]">
      <div className="border-b border-[#E8E6E0] bg-[#0A0A0A] px-5 py-4">
        <div className="mx-auto h-7 w-40 rounded bg-white/10" />
      </div>
      <main className="mx-auto grid max-w-[1180px] gap-6 px-5 py-6 small:grid-cols-[1fr_380px] small:px-8 small:py-10">
        <section className="space-y-4">
          <div className="h-24 animate-pulse rounded-[8px] bg-[#E8E6E0]" />
          <div className="h-44 animate-pulse rounded-[8px] bg-[#E8E6E0]" />
          <div className="h-44 animate-pulse rounded-[8px] bg-[#E8E6E0]" />
          <div className="h-32 animate-pulse rounded-[8px] bg-[#E8E6E0]" />
        </section>
        <aside className="h-80 animate-pulse rounded-[8px] bg-[#E8E6E0]" />
      </main>
    </div>
  )
}
