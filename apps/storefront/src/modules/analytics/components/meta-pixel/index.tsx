"use client"

import {
  flushMetaPixelEvents,
  META_PIXEL_ID,
  trackMetaEvent,
} from "@lib/meta-pixel"
import { usePathname } from "next/navigation"
import Script from "next/script"
import { useEffect, useRef, useState } from "react"

export default function MetaPixel() {
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    if (!ready || lastTrackedPath.current === pathname) {
      return
    }

    lastTrackedPath.current = pathname
    trackMetaEvent("PageView")
    flushMetaPixelEvents()
  }, [pathname, ready])

  return (
    <Script
      id="meta-pixel-base"
      strategy="afterInteractive"
      onReady={() => setReady(true)}
    >
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${META_PIXEL_ID}');
      `}
    </Script>
  )
}
