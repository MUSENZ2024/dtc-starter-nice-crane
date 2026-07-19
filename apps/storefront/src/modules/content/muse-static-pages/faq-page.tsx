"use client"

import { useEffect, useRef } from "react"

import { faqHtml } from "./faq.html"

const visibleFaqHtml = faqHtml
  .replace(
    /\n\n            <div class="faq-item" id="split-pay"[\s\S]*?(?=\n\n          <\/div>\n        <\/div>\n\n        <!-- SECTION 5: SHIPPING -->)/,
    ""
  )
  // The app shell owns the single page-level main landmark.
  .replace("<main>", '<div class="faq-main">')
  .replace("</main>", "</div>")

export default function FaqPage() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // The archived FAQ markup still contains inline callbacks from its
    // standalone HTML version. React supplies the live handlers below.
    root
      .querySelectorAll<HTMLElement>("[onclick], [oninput]")
      .forEach((element) => {
        element.removeAttribute("onclick")
        element.removeAttribute("oninput")
      })

    const promoteToButton = (element: HTMLElement) => {
      if (element instanceof HTMLButtonElement) {
        return element
      }

      const button = document.createElement("button")

      Array.from(element.attributes).forEach((attribute) => {
        if (
          !["onclick", "oninput", "role", "tabindex"].includes(attribute.name)
        ) {
          button.setAttribute(attribute.name, attribute.value)
        }
      })
      button.type = "button"
      button.replaceChildren(...Array.from(element.childNodes))
      element.replaceWith(button)

      return button
    }

    const sectionHeads = Array.from(
      root.querySelectorAll<HTMLElement>(".section-head")
    ).map(promoteToButton)
    const questionRows = Array.from(
      root.querySelectorAll<HTMLElement>(".faq-q")
    ).map(promoteToButton)
    const search = root.querySelector<HTMLInputElement>(".search-input")
    const clear = root.querySelector<HTMLButtonElement>(".search-clear")
    const noResults = root.querySelector<HTMLElement>(".no-results")
    const searchStatus = document.createElement("p")

    searchStatus.className = "sr-only"
    searchStatus.setAttribute("role", "status")
    searchStatus.setAttribute("aria-live", "polite")
    searchStatus.setAttribute("aria-atomic", "true")
    search?.closest(".search-wrap")?.append(searchStatus)

    sectionHeads.forEach((head, index) => {
      const section = head.closest<HTMLElement>(".faq-section")
      const body = section?.querySelector<HTMLElement>(".section-body")
      if (!section || !body) return

      const bodyId = body.id || `faq-section-panel-${index + 1}`
      body.id = bodyId
      head.setAttribute("aria-controls", bodyId)
      if (head.getAttribute("aria-expanded") === "true") {
        section.classList.add("section-open")
      }
    })

    questionRows.forEach((row, index) => {
      const answer = row
        .closest<HTMLElement>(".faq-item")
        ?.querySelector<HTMLElement>(".faq-a")
      if (!answer) return

      const answerId = answer.id || `faq-answer-${index + 1}`
      answer.id = answerId
      row.setAttribute("aria-controls", answerId)
    })

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
        .forEach((openItem) => {
          openItem.classList.remove("open")
          openItem
            .querySelector<HTMLElement>(".faq-q")
            ?.setAttribute("aria-expanded", "false")
        })
      item?.classList.toggle("open", opening)
      row.setAttribute("aria-expanded", String(opening))
      section?.classList.add("section-open")
    }

    const sectionHandlers = sectionHeads.map((head) => {
      const handler = () => toggleSection(head)
      const keyHandler = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          toggleSection(head)
        }
      }
      head.addEventListener("click", handler)
      head.addEventListener("keydown", keyHandler)
      return { element: head, handler, keyHandler }
    })
    const questionHandlers = questionRows.map((row) => {
      const handler = () => toggleQuestion(row)
      const keyHandler = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          toggleQuestion(row)
        }
      }
      row.addEventListener("click", handler)
      row.addEventListener("keydown", keyHandler)
      return { element: row, handler, keyHandler }
    })

    const filter = () => {
      const words = (search?.value ?? "")
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean)
      let matches = 0

      root.querySelectorAll<HTMLElement>(".faq-section").forEach((section) => {
        let sectionMatches = 0
        section.querySelectorAll<HTMLElement>(".faq-item").forEach((item) => {
          const content = `${item.dataset.q ?? ""} ${
            item.textContent ?? ""
          }`.toLowerCase()
          const visible = words.every((word) => content.includes(word))
          item.classList.toggle("hidden", !visible)
          if (visible) sectionMatches += 1
          if (visible && words.length) item.classList.add("open")
        })
        section.classList.toggle("hidden", sectionMatches === 0)
        if (sectionMatches && words.length)
          section.classList.add("section-open")
        matches += sectionMatches
      })

      clear?.classList.toggle("visible", words.length > 0)
      noResults?.classList.toggle("visible", words.length > 0 && matches === 0)
      searchStatus.textContent = words.length
        ? `${matches} FAQ ${matches === 1 ? "answer" : "answers"} found`
        : "All FAQ answers shown"
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

      const item = root.querySelector<HTMLElement>(
        `.faq-item#${CSS.escape(id)}`
      )
      const directSection = root.querySelector<HTMLElement>(
        `.faq-section#${CSS.escape(id)}`
      )
      const section =
        item?.closest<HTMLElement>(".faq-section") ?? directSection
      if (!section) return

      const question = item?.querySelector<HTMLButtonElement>(".faq-q")
      const sectionHead =
        section.querySelector<HTMLButtonElement>(".section-head")

      section.classList.add("section-open")
      sectionHead?.setAttribute("aria-expanded", "true")
      item?.classList.add("open")
      question?.setAttribute("aria-expanded", "true")

      window.requestAnimationFrame(() => {
        const target = question ?? sectionHead
        target?.focus({ preventScroll: true })
        ;(item ?? section).scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "center",
        })
      })
    }

    if (window.location.hash) {
      openDeepLink(window.location.hash)
    }

    const handleHashChange = () => openDeepLink(window.location.hash)
    window.addEventListener("hashchange", handleHashChange)

    return () => {
      window.removeEventListener("hashchange", handleHashChange)
      sectionHandlers.forEach(({ element, handler, keyHandler }) => {
        element.removeEventListener("click", handler)
        element.removeEventListener("keydown", keyHandler)
      })
      questionHandlers.forEach(({ element, handler, keyHandler }) => {
        element.removeEventListener("click", handler)
        element.removeEventListener("keydown", keyHandler)
      })
      search?.removeEventListener("input", filter)
      searchStatus.remove()
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
