"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

export default function HoverImage({ src, sizes }: { src: string; sizes: string }) {
  const anchor = useRef<HTMLSpanElement>(null)
  const [requested, setRequested] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const parent = anchor.current?.closest("a")
    const enter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") setRequested(true)
    }
    parent?.addEventListener("pointerenter", enter)
    return () => parent?.removeEventListener("pointerenter", enter)
  }, [])
  return <span ref={anchor} className="pointer-events-none absolute inset-0 z-[1]">
    {requested && <Image src={src} alt="" aria-hidden="true" fill quality={60} sizes={sizes}
      onLoad={() => setReady(true)}
      className={`object-cover opacity-0 transition duration-500 ${ready ? "motion-safe:group-hover:opacity-100" : ""}`} />}
  </span>
}
