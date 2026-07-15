export default function ProductLoading() {
  return (
    <div className="bg-[#F4F2ED] text-[#1A1A1A]">
      <div className="mx-auto max-w-[1320px] px-[18px] pt-4 small:px-8 small:pt-5">
        <div className="h-4 w-56 rounded-full bg-[#E8E6E0]" />
      </div>
      <section className="mx-auto grid max-w-[1320px] gap-7 px-[18px] py-4 pb-20 small:grid-cols-[1.15fr_1fr] small:gap-14 small:px-8 small:py-6 small:pb-[72px]">
        <div className="aspect-square animate-pulse rounded-[26px] bg-[#ECE9E2]" />
        <div className="space-y-4">
          <div className="h-5 w-32 rounded-full bg-[#E8E6E0]" />
          <div className="h-12 w-4/5 rounded bg-[#E8E6E0]" />
          <div className="h-8 w-36 rounded bg-[#E8E6E0]" />
          <div className="grid grid-cols-4 gap-2 pt-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-11 rounded-[8px] bg-[#E8E6E0]" />
            ))}
          </div>
          <div className="h-12 rounded-full bg-[#0A0A0A]" />
          <div className="h-12 rounded-full bg-[#E8E6E0]" />
        </div>
      </section>
    </div>
  )
}
