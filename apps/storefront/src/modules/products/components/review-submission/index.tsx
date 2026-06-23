"use client"

import { sdk } from "@lib/config"
import { FormEvent, useState } from "react"

export default function ReviewSubmission({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    const form = new FormData(event.currentTarget)
    try {
      await sdk.client.fetch("/store/reviews", {
        method: "POST",
        body: {
          product_id: productId,
          rating: Number(form.get("rating")),
          reviewer_name: String(form.get("reviewer_name")),
          reviewer_email: String(form.get("reviewer_email")) || undefined,
          title: String(form.get("title")) || undefined,
          content: String(form.get("content")),
        },
      })
      event.currentTarget.reset()
      setMessage("Thanks—your review has been submitted for approval.")
    } catch {
      setMessage("We could not submit that review. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-8 border-t border-[#E8E6E0] pt-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="min-h-11 rounded-md bg-[#0A0A0A] px-5 text-xs font-bold uppercase tracking-[0.08em] text-white hover:bg-[#333]"
      >
        Write a review
      </button>
      {open && (
        <form onSubmit={submit} className="mt-5 grid max-w-xl gap-3" aria-label="Write a review">
          <label className="text-sm font-semibold">Rating
            <select required name="rating" defaultValue="" className="mt-1 block w-full rounded border border-[#CFCBC2] bg-white p-3">
              <option value="" disabled>Select a rating</option>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} out of 5</option>)}
            </select>
          </label>
          <input required name="reviewer_name" minLength={2} maxLength={80} placeholder="Your name" className="rounded border border-[#CFCBC2] bg-white p-3 text-sm" />
          <input name="reviewer_email" type="email" placeholder="Email (not published)" className="rounded border border-[#CFCBC2] bg-white p-3 text-sm" />
          <input name="title" maxLength={120} placeholder="Review title (optional)" className="rounded border border-[#CFCBC2] bg-white p-3 text-sm" />
          <textarea required name="content" minLength={20} maxLength={1500} rows={5} placeholder="Tell us about your purchase (at least 20 characters)" className="rounded border border-[#CFCBC2] bg-white p-3 text-sm" />
          <button disabled={submitting} className="min-h-11 w-fit rounded-md bg-[#C1440E] px-5 text-xs font-bold uppercase tracking-[0.08em] text-white disabled:opacity-60">
            {submitting ? "Submitting…" : "Submit review"}
          </button>
          {message && <p className="text-sm text-[#333]" role="status">{message}</p>}
        </form>
      )}
    </div>
  )
}
