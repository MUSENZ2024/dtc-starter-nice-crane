"use client"

import { useEffect, useState } from "react"

const START_SECONDS = 4 * 24 * 60 * 60 + 14 * 60 * 60 + 22 * 60 + 41

const getParts = (seconds: number) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return [
    ["Days", days],
    ["Hours", hours],
    ["Mins", mins],
    ["Secs", secs],
  ]
}

export default function DropCountdown() {
  const [remaining, setRemaining] = useState(START_SECONDS)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((current) => (current <= 1 ? START_SECONDS : current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="mb-8 flex gap-3 xsmall:gap-3.5">
      {getParts(remaining).map(([label, value]) => (
        <div
          key={label}
          className="min-w-[58px] rounded-[14px] border border-white/15 bg-white/[0.06] px-3 py-3 text-center xsmall:min-w-[64px] xsmall:px-4"
        >
          <div className="text-[20px] font-black leading-none tracking-[-0.02em] text-[#C8D050] xsmall:text-[22px]">
            {String(value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/45">
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}
