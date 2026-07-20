"use client"

import Link from "next/link"
import React from "react"

/**
 * The storefront has one public market, so customer-facing links stay clean.
 * Middleware supplies the internal New Zealand country route to Next.js.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: unknown
}) => {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
