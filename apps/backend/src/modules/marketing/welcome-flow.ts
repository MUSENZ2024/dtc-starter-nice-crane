export const WELCOME_FLOW_KEY = "welcome_first_time_v1"
export const WELCOME_FLOW_STEPS = [
  { sequence_number: 1, name: "Offer delivery", template_key: "welcome_offer_delivery", delay_minutes: 0, subject: "Welcome to MUSE—your $20 is inside", preview_text: "Your first-order welcome code is ready." },
  { sequence_number: 2, name: "Trust", template_key: "welcome_trust", delay_minutes: 22 * 60, subject: "What shopping with MUSE actually looks like", preview_text: "Tracked delivery, local support, and straightforward returns." },
  { sequence_number: 3, name: "Discovery", template_key: "welcome_discovery", delay_minutes: 48 * 60, subject: "The MUSE pieces worth knowing about", preview_text: "A focused edit based on what you want to see." },
  { sequence_number: 4, name: "Personal check-in", template_key: "welcome_personal_checkin", delay_minutes: 72 * 60, subject: "Did your MUSE code come through?", preview_text: "Reply if you need help choosing a size or product." },
  { sequence_number: 5, name: "Last chance", template_key: "welcome_last_chance", delay_minutes: 108 * 60, subject: "Your MUSE welcome code expires tonight", preview_text: "Your welcome code is nearly at its real expiry time." },
] as const

export const discoverySubject = (preference: string) => ({
  footwear: "The footwear MUSE customers keep coming back for",
  outerwear: "Outerwear worth knowing about",
  restocks: "Your next-size restock starts here",
  everything: "The MUSE pieces worth knowing about",
}[preference] || "The MUSE pieces worth knowing about")
