"use client"

import { ChangeEvent, FormEvent, useRef, useState } from "react"
import { itemRequestSdk } from "@lib/item-request-client"

type FormStatus = "idle" | "submitting" | "success" | "error"
const MAX_FILE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export default function ItemRequestForm() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<FormStatus>("idle")
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setMessage("")
    if (!nextFile) return
    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setMessage("Please choose a JPG, PNG or WebP image.")
      event.target.value = ""
      return
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setMessage("That image is over 5 MB. Please choose a smaller one.")
      event.target.value = ""
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(nextFile)
    setPreview(URL.createObjectURL(nextFile))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) {
      setMessage("Add a clear photo of the item you want.")
      inputRef.current?.focus()
      return
    }
    setStatus("submitting")
    setMessage("")
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    form.set("image", file)
    try {
      await itemRequestSdk.client.fetch("/store/item-requests", {
        method: "POST",
        headers: { "content-type": null },
        body: form,
      })
      setStatus("success")
      setMessage("Request received. We’ll review the item and contact you with the next step.")
      formElement.reset()
      setFile(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error && error.message ? error.message : "We couldn't send your request. Please try again.")
    }
  }

  if (status === "success") return <div className="border border-[#287a4b] bg-[#f1f8f3] p-6" role="status"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#287a4b]">Request sent</p><h3 className="mt-2 font-condensed text-[25px] leading-tight">We have what we need.</h3><p className="mt-3 max-w-[520px] text-[14px] leading-6 text-muse-text-muted">{message}</p><button type="button" onClick={() => { setStatus("idle"); setMessage("") }} className="mt-5 min-h-11 border border-muse-black px-5 text-[13px] font-bold">Request another item</button></div>

  return <form onSubmit={submit} className="grid gap-5">
    <div className="grid gap-5 small:grid-cols-2"><Field label="Item name" required><input name="item_name" required minLength={2} maxLength={140} placeholder="e.g. Black leather shoulder bag" className="muse-request-input" /></Field><Field label="Item type" required><select name="item_type" required defaultValue="bag" className="muse-request-input"><option value="bag">Bag</option><option value="watch">Watch</option><option value="wallet">Wallet</option><option value="accessory">Accessory</option><option value="other">Other</option></select></Field></div>
    <Field label="Photo" required hint="JPG, PNG or WebP. Maximum 5 MB."><input ref={inputRef} id="request-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} className="sr-only" /><label htmlFor="request-photo" className="flex min-h-[112px] cursor-pointer items-center gap-4 border border-dashed border-[#aaa59e] bg-white p-4 transition hover:border-muse-black">{preview ? <img src={preview} alt="Selected item preview" className="h-20 w-20 object-cover" /> : <span aria-hidden="true" className="flex h-20 w-20 items-center justify-center bg-muse-merch-grey text-2xl">＋</span>}<span><span className="block text-[14px] font-bold">{file ? "Change photo" : "Choose a photo"}</span><span className="mt-1 block text-[12px] text-muse-text-muted">{file?.name ?? "A clear screenshot or product photo works best."}</span></span></label></Field>
    <Field label="Anything else we should know?" hint="Optional. Add colour, size, model or a link if you have one."><textarea name="details" maxLength={1000} rows={4} className="muse-request-input resize-y" /></Field>
    <div className="grid gap-5 small:grid-cols-2"><Field label="Your name" required><input name="requester_name" autoComplete="name" required minLength={2} maxLength={100} className="muse-request-input" /></Field><Field label="Email" required><input name="email" type="email" autoComplete="email" required maxLength={200} className="muse-request-input" /></Field></div>
    <Field label="Phone" hint="Optional"><input name="phone" type="tel" autoComplete="tel" maxLength={40} className="muse-request-input" /></Field>
    {message && <p role="alert" className="text-[13px] font-medium text-muse-sale">{message}</p>}
    <p className="text-[12px] leading-5 text-muse-text-muted">We’ll use these details only to review your request and contact you about a quote.</p>
    <button type="submit" disabled={status === "submitting"} className="min-h-12 w-full bg-muse-black px-6 py-3 text-[14px] font-bold text-white transition hover:bg-muse-orange disabled:cursor-wait disabled:opacity-60 small:w-auto small:justify-self-start">{status === "submitting" ? "Sending request…" : "Send item request"}</button>
  </form>
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return <label className="grid gap-2"><span className="text-[13px] font-bold">{label}{required && <span aria-hidden="true"> *</span>}</span>{children}{hint && <span className="text-[11px] leading-4 text-muse-text-muted">{hint}</span>}</label>
}
