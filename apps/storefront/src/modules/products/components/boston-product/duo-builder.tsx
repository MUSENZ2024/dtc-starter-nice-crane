"use client"

import { useEffect, useRef, useState } from "react"
import type { BostonColour } from "./index"
import { isVariantPurchasable as variantIsPurchasable } from "@lib/util/product-availability"

export const BOSTON_DUO_PRICE = 270
export function BostonOfferSwitch({ duo, onChange }: { duo: boolean; onChange: (duo: boolean) => void }) {
  return <fieldset className="mb-4">
    <legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em]">Choose your offer</legend>
    <div className="grid grid-cols-2 gap-2">
      {[false, true].map((isDuo) => <label key={String(isDuo)} className={`relative flex min-h-[56px] cursor-pointer flex-col justify-center border px-2.5 py-1.5 ${duo === isDuo ? "border-[#0A0A0A] bg-[#F4F2ED]" : "border-[#E8E6E0] bg-white"}`}>
        <span className="flex items-center gap-1.5"><input type="radio" name="boston-offer" checked={duo === isDuo} onChange={() => onChange(isDuo)} className="accent-black" /><strong className="text-sm leading-5">{isDuo ? "Duo" : "Single"}</strong></span>
        <span className="text-[11px] font-semibold leading-4">{isDuo ? "NZ$270 for 2 pairs" : "NZ$150 for 1 pair"}</span>
      </label>)}
    </div>
  </fieldset>
}

type Choice = { colour: number; variant: string }
export default function BostonDuoBuilder({ colours, initialColour, onPreviewColour }: { colours: BostonColour[]; initialColour: number; onPreviewColour: (index: number) => void }) {
  const firstColour = useRef(initialColour)
  const [choices, setChoices] = useState<Choice[]>([{ colour: initialColour, variant: "" }, { colour: Math.max(0, colours.findIndex(c=>c.label === "Taupe")), variant: "" }])
  const [openPair, setOpenPair] = useState(0)
  const [reviewed, setReviewed] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const summaryRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem("muse-boston-duo-selection-v2") ?? "null")
      if (!Array.isArray(draft?.pairs) || draft.pairs.length !== 2) return
      const restored: Choice[] = draft.pairs.map((pair: { colour?: string; variantId?: string }) => {
        const index = colours.findIndex(colour => colour.label === pair.colour)
        const colour = index >= 0 ? index : 0
        const variant = colours[colour].product?.variants?.find(item => item.id === pair.variantId)
        return { colour, variant: variant && variantIsPurchasable(variant) ? variant.id : "" }
      })
      // Opening a product always starts Pair 1 in that product's colour.
      // Restore its size only when the saved colour also matches.
      if (restored[0].colour !== firstColour.current) {
        restored[0] = { colour: firstColour.current, variant: "" }
      }
      setChoices(restored)
    } catch { /* Invalid or unavailable local storage leaves the default selection. */ }
  }, [colours])
  const selected = choices.map(choice => ({ colour: colours[choice.colour], variant: colours[choice.colour].product?.variants?.find(v => v.id === choice.variant) }))
  const complete = selected.every(item => item.variant && variantIsPurchasable(item.variant))
  const change = (pair: number, value: Partial<Choice>) => {
    setChoices(current=>current.map((choice,index)=> index === pair ? {...choice,...value} : choice))
    setReviewed(false); setSaved(false); setError("")
  }
  return <div>
    <form onSubmit={event=>{event.preventDefault(); if(!complete)return;setReviewed(true);setTimeout(()=>summaryRef.current?.focus(),0)}}>
      <div className="divide-y divide-[#D5D2CC] border-y border-[#D5D2CC]">
        {choices.map((choice,pair)=>{
          const colour = colours[choice.colour]
          return <section key={pair}>
            <h2><button type="button" onClick={()=>{setOpenPair(pair);onPreviewColour(choice.colour)}} aria-expanded={openPair === pair} aria-controls={`boston-pair-${pair}`} className="flex min-h-16 w-full items-center justify-between gap-3 py-4 text-left">
              <span><strong className="text-base">Pair {pair+1}</strong><span className="ml-3 text-sm text-[#555]">{colour.label} · {selected[pair].variant ? `EU ${selected[pair].variant?.title}` : "Choose a size"}</span></span>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={openPair === pair ? "rotate-180" : ""}><path d="m6 9 6 6 6-6" /></svg>
            </button></h2>
            <div id={`boston-pair-${pair}`} hidden={openPair !== pair} className="pb-6">
              <fieldset className="mb-6"><legend className="mb-3 flex w-full justify-between text-xs font-bold uppercase tracking-[0.12em]">Colour <span className="font-medium normal-case tracking-normal">{colour.label}</span></legend>
                <div className="flex flex-wrap gap-2.5">{colours.map((item,index)=><button type="button" key={item.label} aria-label={`Pair ${pair+1}: ${item.label}`} aria-pressed={choice.colour === index} title={item.label} disabled={!item.product} onClick={()=>{change(pair,{colour:index,variant:""});onPreviewColour(index)}} className={`h-11 w-11 rounded-none border-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-30 ${choice.colour === index ? "border-black" : "border-transparent"}`} style={{background:item.swatch}} />)}</div>
              </fieldset>
              <fieldset><legend className="mb-3 text-xs font-bold uppercase tracking-[0.12em]">Size · EU</legend>
                <div className="grid grid-cols-6 gap-2">{[...(colour.product?.variants ?? [])].sort((a,b)=>Number(a.title)-Number(b.title)).map(variant=><label key={variant.id} className={`flex min-h-11 cursor-pointer items-center justify-center border text-sm font-bold ${choice.variant === variant.id ? "border-black bg-black text-white" : "border-[#D5D2CC]"} ${!variantIsPurchasable(variant) ? "opacity-30" : ""}`}>
                  <input className="sr-only peer" type="radio" name={`pair-${pair}-size`} value={variant.id} checked={choice.variant === variant.id} disabled={!variantIsPurchasable(variant)} onChange={()=>change(pair,{variant:variant.id})} aria-label={`Pair ${pair+1} size ${variant.title}`} />
                  <span className="peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4">{variant.title}</span>
                </label>)}</div>
              </fieldset>
              {colour.product?.metadata?.image_status === "awaiting_user_photos" && <p className="mt-3 text-xs text-[#555]">Photos for this colour are coming soon.</p>}
              {pair === 0 && selected[0].variant && <button type="button" className="mt-4 min-h-11 text-sm font-bold underline underline-offset-4" onClick={()=>{setOpenPair(1);onPreviewColour(choices[1].colour)}}>Choose pair 2</button>}
            </div>
          </section>
        })}
      </div>
      <div className="my-6 flex items-end justify-between gap-4"><p className="text-sm text-[#555]">Duo total · 2 pairs</p><p className="text-2xl font-black">NZ$270</p></div>
      <button type="submit" disabled={!complete} className="min-h-14 w-full bg-[#0A0A0A] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-40">{complete ? "Review your duo · NZ$270" : "Choose a size for both pairs"}</button>
      <p className="mt-3 text-xs leading-5 text-[#555]">Local preview. Duo checkout is not connected yet.</p>
    </form>
    {reviewed && <div ref={summaryRef} tabIndex={-1} className="mt-6 border border-[#D5D2CC] bg-[#F4F2ED] p-5 outline-none" aria-label="Your duo summary">
      <h2 className="text-xl font-bold">Your Boston duo</h2>
      <ul className="my-4 space-y-2 text-sm">{selected.map((item,pair)=><li key={pair}>Pair {pair+1}: <strong>{item.colour.label}</strong> · EU {item.variant?.title} · NZ$135</li>)}</ul>
      <p className="text-sm">Standard Delivery · approximately 13–16 business days.</p>
      <p className="mt-3 text-lg font-bold">Total: NZ$270</p>
      <button type="button" onClick={()=>{try{localStorage.setItem("muse-boston-duo-selection-v2",JSON.stringify({pairs:selected.map(item=>({colour:item.colour.label,variantId:item.variant?.id,size:item.variant?.title})),total:BOSTON_DUO_PRICE}));setSaved(true)}catch{setError("Your browser couldn’t save this selection. You can still review it here.")}}} className="mt-4 min-h-11 border border-black px-4 text-sm font-bold">Save duo selection</button>
      <p role="status" className="mt-3 text-xs text-[#555]">{saved ? "Selection saved on this device. No order has been placed." : error}</p>
    </div>}
  </div>
}
