import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=path.resolve(import.meta.dirname,'..'),dir=path.resolve(root,'../medusa-imports/yupoo-puma-585242-2026-09-04')
const report=JSON.parse(await fs.readFile(path.join(dir,'medusa-import-report.json'),'utf8'))
const plan=JSON.parse(await fs.readFile(path.join(dir,'apply-plan.json'),'utf8'))
const adminKey=(await fs.readFile(path.join(root,'.image-upload.env'),'utf8')).match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)[1].trim()
const env=await fs.readFile(path.join(root,'apps/storefront/.env.local'),'utf8')
const pub=env.match(/^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g,'')
assert(pub,'Missing publishable key')
const backend='https://appealing-quince-change.medusajs.app'
async function get(url,headers){const r=await fetch(url,{headers,signal:AbortSignal.timeout(60000)});assert(r.ok,`${url} ${r.status} ${r.ok ? "" : await r.text()}`);return r.json()}
const a=await get(backend+'/admin/products?q=puma&limit=100&fields='+encodeURIComponent('id,title,handle,status,thumbnail,metadata,*images,*tags,*categories,*sales_channels,*variants,*variants.prices,*variants.options,*options,*shipping_profile,collection_id,type_id'),{Authorization:`Basic ${adminKey}`})
const products=a.products.filter(p=>report.created.some(e=>e.id===p.id))
assert.equal(products.length,22)
let variants=0,images=0
for(const p of products){
 const job=plan.jobs.find(j=>j.handle===p.handle);assert(job)
 const imported=report.created.find(e=>e.id===p.id);if(imported.thumbnail){assert.equal(p.thumbnail,imported.thumbnail);assert.equal(p.images[0].url,imported.thumbnail)}
 assert.equal(p.status,'published');assert.equal(p.images.length,8);assert.equal(p.variants.length,job.sizes.length)
 assert.equal(p.collection_id,plan.taxonomy.collection_id);assert.equal(p.type_id,plan.taxonomy.type_id);assert.equal(p.shipping_profile.id,plan.taxonomy.shipping_profile_id)
 assert(p.categories.some(c=>c.id===plan.taxonomy.category_id));assert(p.sales_channels.some(c=>c.id===plan.taxonomy.sales_channel_id))
 for(const tag of job.tag_values)assert(p.tags.some(t=>t.value===tag),`${p.handle} missing ${tag}`)
 assert.equal(p.metadata.seo_title,job.metadata.seo_title);assert.equal(p.metadata.meta_description,job.metadata.meta_description)
 assert.equal(p.metadata.fit_feedback.true,91);assert.equal(p.metadata.sizing_profile,'puma-footwear-v1')
 for(const v of p.variants){assert(v.prices.some(x=>x.currency_code==='nzd'&&x.amount===160));assert(job.payload.variants.some(x=>x.title===v.title));assert(v.options.some(o=>o.value===v.title))}
 assert(p.images.every(i=>i.url.startsWith('https://')&&!/yupoo|squarespace/.test(i.url)));assert(p.images.some(i=>i.url===p.thumbnail))
 variants+=p.variants.length;images+=p.images.length
}
const tag=products[0].tags.find(t=>t.value==='puma').id
const regions=await get(backend+'/store/regions',{'x-publishable-api-key':pub});const region=regions.regions.find(r=>r.countries.some(c=>c.iso_2==='nz'))
const s=await get(backend+'/store/products?limit=100&tag_id[]='+tag+'&region_id='+region.id+'&fields='+encodeURIComponent('id,title,handle,thumbnail,*images,*options,*variants.options,*variants.calculated_price,metadata,*tags'),{'x-publishable-api-key':pub})
assert.equal(s.products.filter(p=>report.created.some(e=>e.id===p.id)).length,22)
for(const p of s.products){if(!report.created.some(e=>e.id===p.id))continue;assert(p.variants.every(v=>v.calculated_price?.calculated_amount===160),p.handle);assert.equal(p.images.length,8);const expected=report.created.find(e=>e.id===p.id)?.thumbnail;if(expected){assert.equal(p.thumbnail,expected);assert.equal(p.images[0].url,expected)}}
await fs.writeFile(path.join(dir,'verified-admin-products.json'),JSON.stringify(products,null,2))
const summary={verified_at:new Date().toISOString(),products:products.length,variants,images,price_nzd:160,admin_taxonomy_and_metadata:'passed',store_puma_filter_and_prices:'passed',held:report.review.filter(r=>r.import_status==='needs_review').map(r=>r.product_code),duplicates:report.review.filter(r=>r.import_status==='skipped_duplicate_album').map(r=>r.product_code)}
await fs.writeFile(path.join(dir,'verification-report.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary))
// CSV is an audit/export of imported rows, with actual product/variant/tag IDs.
const keys=['Product Id','Product Handle','Product Title','Product Subtitle','Product Description','Product Status','Product Thumbnail','Shipping Profile Id','Product Sales Channel 1','Product Collection Id','Product Category 1','Product Type Id','Product External Id',...Array.from({length:8},(_,i)=>`Product Tag ${i+1}`),'Variant Id','Variant Title','Variant SKU','Variant Allow Backorder','Variant Manage Inventory','Variant Price NZD','Variant Option 1 Name','Variant Option 1 Value',...Array.from({length:8},(_,i)=>`Product Image ${i+1} Url`)]
const rows=[]
for(const p of products)for(const v of p.variants){const j=plan.jobs.find(j=>j.handle===p.handle);rows.push([p.id,p.handle,p.title,'Standard Delivery',j.description,p.status,p.thumbnail,p.shipping_profile.id,plan.taxonomy.sales_channel_id,p.collection_id,plan.taxonomy.category_id,p.type_id,j.payload.external_id,...Array.from({length:8},(_,i)=>p.tags[i]?.id||''),v.id,v.title,v.sku,true,false,160,'Size',v.title,...p.images.map(i=>i.url)])}
const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"'
await fs.writeFile(path.join(dir,'medusa-import.csv'),[keys,...rows].map(r=>r.map(cell).join(',')).join('\n'))
