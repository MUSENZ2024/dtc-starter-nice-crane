export type CampaignBlock = { type: "hero" | "text" | "product_grid" | "category_row" | "review" | "offer" | "trust" | "divider"; [key: string]: unknown }
const escape = (value: unknown) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!))
const allowUrl = (value: unknown) => { const url = String(value || ""); return /^(https:\/\/([a-z0-9-]+\.)*musenz\.com|https?:\/\/localhost(?::\d+)?)(\/|$)/i.test(url) ? url : "https://musenz.com" }

export const validateCampaignContent = (content: unknown) => {
  if (!Array.isArray(content) || !content.length) return ["At least one structured content block is required."]
  const allowed = new Set(["hero","text","product_grid","category_row","review","offer","trust","divider"])
  return content.flatMap((block: any, index) => !block || !allowed.has(block.type) ? [`Block ${index + 1} has an unsupported type.`] : [])
}

export const renderCampaignEmail = ({ subject, previewText, blocks, unsubscribeUrl, utmCampaign }: { subject: string; previewText: string; blocks: CampaignBlock[]; unsubscribeUrl: string; utmCampaign: string }) => {
  const renderBlock = (block: CampaignBlock) => {
    if (block.type === "hero") return `<section><img src="${escape(block.image_url)}" alt="${escape(block.alt)}" style="width:100%;border-radius:12px"><h1>${escape(block.headline)}</h1><p>${escape(block.body)}</p><a href="${escape(allowUrl(block.cta_url))}?utm_source=muse_email&utm_medium=email&utm_campaign=${encodeURIComponent(utmCampaign)}">${escape(block.cta_label || "SHOP NOW")}</a></section>`
    if (block.type === "text") return `<section><h2>${escape(block.heading)}</h2><p>${escape(block.body)}</p></section>`
    if (block.type === "product_grid") return `<section><h2>${escape(block.heading || "Shop the edit")}</h2><p>${escape(block.product_handles)}</p><a href="https://musenz.com/store?utm_source=muse_email&utm_medium=email&utm_campaign=${encodeURIComponent(utmCampaign)}">SHOP PRODUCTS</a></section>`
    if (block.type === "category_row") return `<section><h2>${escape(block.heading)}</h2><p>${escape(block.categories)}</p></section>`
    if (block.type === "review") return `<blockquote>“${escape(block.quote)}”<br><strong>${escape(block.author)}</strong></blockquote>`
    if (block.type === "offer") return `<section><h2>${escape(block.heading || "Your offer")}</h2><p>${escape(block.body)}</p><strong>${escape(block.code)}</strong></section>`
    if (block.type === "trust") return `<section><p>Tracked delivery · 30-day returns · Real Kiwi support</p></section>`
    return `<hr>`
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(subject)}</title></head><body style="margin:0;background:#f4f3ee;font-family:Arial,sans-serif;color:#111"><div style="display:none">${escape(previewText)}</div><main style="max-width:640px;margin:auto;background:#fff;padding:32px"><header style="font-size:32px;font-weight:800;letter-spacing:4px">MUSE</header>${blocks.map(renderBlock).join("")}<footer style="margin-top:40px;border-top:1px solid #ddd;padding-top:20px;font-size:12px;color:#666">MUSE NZ · Auckland, New Zealand<br><a href="${escape(unsubscribeUrl)}">Unsubscribe</a></footer></main></body></html>`
}
