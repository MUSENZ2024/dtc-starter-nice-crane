"use client"

import { useEffect, useRef } from "react"

import { faqHtml } from "./faq.html"

const visibleFaqHtml = faqHtml.replace(
  /\n\n            <div class="faq-item" id="split-pay"[\s\S]*?(?=\n\n          <\/div>\n        <\/div>\n\n        <!-- SECTION 5: SHIPPING -->)/,
  ""
)

export default function FaqPage() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // The archived FAQ markup still contains inline callbacks from its
    // standalone HTML version. React supplies the live handlers below.
    root.querySelectorAll<HTMLElement>("[onclick], [oninput]").forEach(
      (element) => {
        element.removeAttribute("onclick")
        element.removeAttribute("oninput")
      }
    )

    const sectionHeads = Array.from(
      root.querySelectorAll<HTMLElement>(".section-head")
    )
    const questionRows = Array.from(
      root.querySelectorAll<HTMLElement>(".faq-q")
    )
    const search = root.querySelector<HTMLInputElement>(".search-input")
    const clear = root.querySelector<HTMLButtonElement>(".search-clear")
    const noResults = root.querySelector<HTMLElement>(".no-results")

    const toggleSection = (head: HTMLElement) => {
      const section = head.closest(".faq-section")
      const open = section?.classList.toggle("section-open") ?? false
      head.setAttribute("aria-expanded", String(open))
    }

    const toggleQuestion = (row: HTMLElement) => {
      const item = row.closest(".faq-item")
      const section = row.closest(".faq-section")
      const opening = !item?.classList.contains("open")

      section
        ?.querySelectorAll(".faq-item.open")
        .forEach((openItem) => openItem.classList.remove("open"))
      item?.classList.toggle("open", opening)
      row.setAttribute("aria-expanded", String(opening))
      section?.classList.add("section-open")
    }

    const activate = (element: HTMLElement, action: () => void) => {
      element.setAttribute("role", "button")
      element.setAttribute("tabindex", "0")
      element.addEventListener("click", action)
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          action()
        }
      })
    }

    sectionHeads.forEach((head) => activate(head, () => toggleSection(head)))
    questionRows.forEach((row) => activate(row, () => toggleQuestion(row)))

    const filter = () => {
      const words = (search?.value ?? "").toLowerCase().trim().split(/\s+/).filter(Boolean)
      let matches = 0

      root.querySelectorAll<HTMLElement>(".faq-section").forEach((section) => {
        let sectionMatches = 0
        section.querySelectorAll<HTMLElement>(".faq-item").forEach((item) => {
          const content = `${item.dataset.q ?? ""} ${item.textContent ?? ""}`.toLowerCase()
          const visible = words.every((word) => content.includes(word))
          item.classList.toggle("hidden", !visible)
          if (visible) sectionMatches += 1
          if (visible && words.length) item.classList.add("open")
        })
        section.classList.toggle("hidden", sectionMatches === 0)
        if (sectionMatches && words.length) section.classList.add("section-open")
        matches += sectionMatches
      })

      clear?.classList.toggle("visible", words.length > 0)
      noResults?.classList.toggle("visible", words.length > 0 && matches === 0)
    }

    search?.addEventListener("input", filter)
    clear?.addEventListener("click", () => {
      if (search) search.value = ""
      filter()
      search?.focus()
    })

    const openDeepLink = (hash: string) => {
      const id = hash.replace(/^#/, "")
      if (!id) return

      const item = root.querySelector<HTMLElement>(`.faq-item#${CSS.escape(id)}`)
      if (!item) return

      const section = item.closest(".faq-section")
      const question = item.querySelector<HTMLElement>(".faq-q")

      section?.classList.add("section-open")
      section?.querySelector(".section-head")?.setAttribute("aria-expanded", "true")
      item.classList.add("open")
      question?.setAttribute("aria-expanded", "true")

      window.requestAnimationFrame(() => {
        item.scrollIntoView({ behavior: "smooth", block: "center" })
      })
    }

    if (window.location.hash) {
      openDeepLink(window.location.hash)
    }

    const handleHashChange = () => openDeepLink(window.location.hash)
    window.addEventListener("hashchange", handleHashChange)

    return () => {
      window.removeEventListener("hashchange", handleHashChange)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="muse-static-page muse-static-page-faq"
      dangerouslySetInnerHTML={{ __html: visibleFaqHtml }}
    />
  )
}
