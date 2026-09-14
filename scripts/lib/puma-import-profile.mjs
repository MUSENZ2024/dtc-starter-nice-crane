import fs from 'node:fs/promises'
export const pumaChart = JSON.parse(await fs.readFile(new URL('../../apps/storefront/src/lib/util/puma-sizing.json', import.meta.url), 'utf8'))
export const pumaLabel = row => `M ${row.men}${row.women ? ` / W ${row.women}` : ''}`
export function pumaSizesForRange(title) {
  const range = title.match(/(\d{2}(?:\.\d)?)\s*-\s*(\d{2}(?:\.\d)?)/)
  if (!range) throw new Error(`Missing source EU size range: ${title}`)
  const rows = pumaChart.rows.filter(row => Number(row.eu) >= Number(range[1]) && Number(row.eu) <= Number(range[2]))
  if (!rows.length) throw new Error('No supported Puma sizes')
  return rows
}
export function pumaImportMetadata() {
  return { brand: 'Puma', product_kind: 'footwear', sizing_profile: 'puma-footwear-v1', source_size_system: 'eu', display_size_system: 'us-men-women', size_note: pumaChart.note, size_chart_source: pumaChart.source, size_chart: pumaChart.rows, fit_feedback: pumaChart.fit, fit_sized_down: 1, fit_true_to_size: 91, fit_sized_up: 8, fit_source: 'merchant_supplied' }
}
export function validatePumaProduct(product) {
  for (const field of ['brand','model','colourway','primary_colour','seo_title','meta_description','product_code','source_url','stockx_search_query','sizing_profile']) {
    if (!product.metadata?.[field]) throw new Error(`Missing required metadata: ${field}`)
  }
  if (!product.title || !product.handle || !product.description || !product.category_name || !product.type_name) throw new Error('Missing product copy/taxonomy')
  if (!product.tag_values?.includes('puma') || !product.tag_values.includes('puma-speedcat') || !product.tag_values.some(t => t.startsWith('colour:'))) throw new Error('Missing brand/model/colour tags')
  if (!product.sizes?.length || new Set(product.sizes.map(pumaLabel)).size !== product.sizes.length) throw new Error('Invalid or duplicate sizes')
  if (!product.images_local || product.images_local.length !== 8) throw new Error('Eight local images required')
  if (!product.thumbnail_local || !product.images_local.includes(product.thumbnail_local)) throw new Error('Verified shoe-on-box thumbnail required')
  if (!Number.isFinite(product.price_nzd) || product.price_nzd <= 0) throw new Error('Explicit positive NZD price required')
}
