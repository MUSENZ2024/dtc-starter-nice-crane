"use client"

import { useEffect, useId, useRef, useState } from "react"

type ExpandableReviewTextProps = {
  text: string
  collapsedLines?: 2 | 4
  className?: string
}

const clampClasses = {
  2: "line-clamp-2",
  4: "line-clamp-4",
}

const ExpandableReviewText = ({
  text,
  collapsedLines = 2,
  className = "",
}: ExpandableReviewTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [canExpand, setCanExpand] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const textId = useId()

  useEffect(() => {
    const textElement = textRef.current

    if (!textElement || isExpanded) {
      return
    }

    const checkOverflow = () => {
      setCanExpand(textElement.scrollHeight > textElement.clientHeight + 1)
    }

    checkOverflow()

    const resizeObserver = new ResizeObserver(checkOverflow)
    resizeObserver.observe(textElement)

    return () => resizeObserver.disconnect()
  }, [collapsedLines, isExpanded, text])

  return (
    <div>
      <p
        ref={textRef}
        id={textId}
        className={`${
          isExpanded ? "" : clampClasses[collapsedLines]
        } ${className}`}
      >
        {text}
      </p>
      {canExpand && (
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={textId}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className="mt-1.5 inline-flex min-h-11 items-center text-left text-[10px] font-black uppercase tracking-[0.06em] text-[#0A0A0A] underline decoration-[#AAA] underline-offset-4 hover:decoration-[#0A0A0A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0A] small:text-[11px]"
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  )
}

export default ExpandableReviewText
