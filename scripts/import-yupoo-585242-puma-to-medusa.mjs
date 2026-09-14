import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pumaLabel, pumaSizesForRange, pumaImportMetadata, validatePumaProduct } from './lib/puma-import-profile.mjs'
const require = createRequire(import.meta.url)
const { CreateProduct: AdminCreateProduct } = require('../apps/backend/node_modules/@medusajs/medusa/dist/api/admin/products/validators.js')
const root = path.resolve(import.meta.dirname, '..')
const dir = path.resolve(root, '../medusa-imports/yupoo-puma-585242-2026-09-04')
const apply = process.argv.includes('--apply')
const backend = 'https://appealing-quince-change.medusajs.app'
const key = (await fs.readFile(path.join(root, '.image-upload.env'),'utf8')).match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)?.[1]?.trim()
if (!key?.startsWith('sk_')) throw new Error('Missing Admin API key')
const headers = { Authorization: `Basic ${key}` }
async function api(route, body) {
  const response = await fetch(backend+route, {method:body ? 'POST':'GET',headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(180000)})
  const text=await response.text();if(!response.ok) throw new Error(`${route}: ${response.status} ${text.slice(0,600)}`)
  return JSON.parse(text)
}
async function list(route,field,fields='') {
  const all=[]
  for(let offset=0;;offset+=100) {
    const b=await api(`/admin/${route}?limit=100&offset=${offset}${fields?'&fields='+encodeURIComponent(fields):''}`)
    if(!Array.isArray(b[field]))throw new Error(`Unexpected list response ${route}`)
    all.push(...b[field]);if(route==='products')console.log(`Checked ${all.length} existing products`);if(b[field].length<100) return all
  }
}
const raw = JSON.parse(await fs.readFile(path.join(dir,'raw-albums.json'),'utf8'))
const research = JSON.parse(await fs.readFile(path.join(dir,'product-research.json'),'utf8'))
let savedReport
try { savedReport=JSON.parse(await fs.readFile(path.join(dir,'medusa-import-report.json'),'utf8')) } catch { savedReport={created:[],started_at:new Date().toISOString()} }
const existing = await list('products','products','id,title,handle,external_id,metadata,*variants,*tags')
const taxonomy = {}
for(const [route,field,name,keyName] of [['collections','collections','Standard Delivery','collection_id'],['product-types','product_types','Standard Delivery','type_id'],['product-categories','product_categories','Sneakers','category_id'],['shipping-profiles','shipping_profiles','Default Shipping Profile','shipping_profile_id'],['sales-channels','sales_channels','Default Sales Channel','sales_channel_id']]) {
 const values=await list(route,field);const matches=values.filter(v=>(v.name||v.title||v.value)===name)
 if(matches.length!==1)throw new Error(`Ambiguous/missing ${name}`);taxonomy[keyName]=matches[0].id
}
const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')
const slug=v=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
const canonical = code => ({'406329-01':'398846-01','406329-02':'398846-02','406339-52':'406329-52'}[code]||code)
const aliases = code => [...new Set([code,canonical(code),...(canonical(code)==='398846-01'?['406329-01']:[]),...(canonical(code)==='398846-02'?['406329-02']:[]),...(code==='406329-52'?['406339-52','398846-52']:[]),...(code==='406329-40'?['398846-40']:[])])]
// Prefer the albums with the exact StockX codes when the same model/colourway repeats.
const albums=[...raw].sort((a,b)=>Number(['406329-01','406329-02'].includes(a.product_code))-Number(['406329-01','406329-02'].includes(b.product_code))||a.index-b.index)
const seen=new Set(), jobs=[], review=[]
for(const album of albums) {
 const info=research[album.product_code];const code=info?.product_code||album.product_code;const handle=info?slug(info.title):''
 const row={source_product_code:album.product_code,product_code:code,source_url:album.source_url,source_title:album.source_title,local_folder:album.local_folder,local_image_count:album.local_images.length,...info,url_slug:handle,brand:'Puma',category:'Sneakers',type:'Standard Delivery',collection:'Standard Delivery',price_nzd:160,primary_colour:info?.colours[0],secondary_colour:info?.colours[1]||'',colour_family:info?.colours,colour_tags:info?.colours.map(c=>'colour:'+c)}
 const match=existing.find(p=>{
  const values=[p.external_id,p.metadata?.product_code,...(p.metadata?.product_code_aliases||[]),...(p.variants||[]).map(v=>v.sku)].filter(Boolean).map(normalize)
  return p.handle===handle || normalize(p.title)===normalize(info?.title) || aliases(code).some(c=>values.some(v=>v.includes(normalize(c)))) || (normalize(p.metadata?.brand)==='puma'&&normalize(p.metadata?.model)===normalize(info?.model)&&normalize(p.metadata?.colourway)===normalize(info?.colourway))
 })
 if(!info || info.colour_confidence==='needs review') row.import_status='needs_review'
 else if(seen.has(canonical(code)))row.import_status='skipped_duplicate_album'
 else if(match && !savedReport.created.some(p=>p.id===match.id&&p.status==='draft'&&match.metadata?.import_batch==='yupoo-puma-585242-2026-09-04')){row.import_status='skipped_existing';row.medusa_product_id=match.id;row.medusa_handle=match.handle}
 else if(!Number.isInteger(info.thumbnail_image_index) || !album.local_images[info.thumbnail_image_index-1]){row.import_status='needs_review';row.notes=(row.notes||'')+' Verified shoe-on-box thumbnail required.'}
 else {
  const sizes=pumaSizesForRange(album.source_title)
  const tag_values=[...new Set(['puma','puma-speedcat',slug('puma '+info.model),...info.colours.map(c=>'colour:'+c)])]
  const job={...row,handle,title:info.title,category_name:'Sneakers',type_name:'Standard Delivery',sizes,tag_values,images_local:album.local_images,thumbnail_local:album.local_images[info.thumbnail_image_index-1],metadata:{...pumaImportMetadata(),source:'yupoo',thumbnail_selection:'shoe_on_box',thumbnail_source_image:info.thumbnail_image_index,source_category:'https://yolo66.x.yupoo.com/categories/585242?isSubCate=true',source_url:album.source_url,source_title:album.source_title,source_product_code:album.product_code,product_code:code,product_code_aliases:aliases(code),model:info.model,colourway:info.colourway,primary_colour:info.colours[0],secondary_colour:info.colours[1]||null,colour_family:info.colours,colour_confidence:info.colour_confidence,colour_source:info.additional_sources||[info.stockx_url],stockx_url:info.stockx_url,stockx_title:info.stockx_title,stockx_search_query:info.stockx_search_query,stockx_researched_at:'2026-09-04',research_notes:info.notes,seo_title:info.seo_title,meta_description:info.meta_description,fulfilment_type:'standard-delivery',import_batch:'yupoo-puma-585242-2026-09-04'}}
  if(match)job.resume_id=match.id
  validatePumaProduct(job)
  job.payload={title:job.title,handle,description:job.description,status:'draft',subtitle:'Standard Delivery',external_id:`YUP585242-${code}`,discountable:true,collection_id:taxonomy.collection_id,type_id:taxonomy.type_id,shipping_profile_id:taxonomy.shipping_profile_id,categories:[{id:taxonomy.category_id}],sales_channels:[{id:taxonomy.sales_channel_id}],options:[{title:'Size',values:sizes.map(pumaLabel)}],variants:sizes.map((s,i)=>({title:pumaLabel(s),sku:`MUSE-PUMA-${code}-EU${s.eu}`,variant_rank:i,manage_inventory:false,allow_backorder:true,options:{Size:pumaLabel(s)},prices:[{currency_code:'nzd',amount:160}],metadata:{eu_size:s.eu,us_men:s.men,us_women:s.women,cm:s.cm,source_size_system:'eu',display_size_system:'us-men-women'}})),metadata:job.metadata}
  AdminCreateProduct.parse(job.payload)
  row.import_status='ready';row.source_eu_sizes=sizes.map(s=>s.eu).join(' | ');row.variant_labels=sizes.map(pumaLabel).join(' | ');row.tag_values=tag_values.join(' | ')
  jobs.push(job)
 }
 if(info && row.import_status!=='needs_review')seen.add(canonical(code))
 review.push(row)
}
const csvKeys=['source_product_code','product_code','title','brand','model','colourway','primary_colour','secondary_colour','colour_family','colour_tags','colours','colour_confidence','stockx_search_query','stockx_url','stockx_title','additional_sources','seo_title','meta_description','description','url_slug','category','type','collection','price_nzd','source_eu_sizes','variant_labels','tag_values','source_url','source_title','local_folder','local_image_count','import_status','medusa_product_id','notes']
const cell=v=>'"'+(typeof v==='object'?JSON.stringify(v):String(v??'')).replaceAll('"','""')+'"'
async function saveReview(){await fs.writeFile(path.join(dir,'puma-enriched-review.csv'),[csvKeys.join(','),...review.map(r=>csvKeys.map(k=>cell(r[k])).join(','))].join('\n'))}
await saveReview()
await fs.writeFile(path.join(dir,apply?'apply-plan.json':'dry-run-plan.json'),JSON.stringify({taxonomy,existing_count:existing.length,jobs,review},null,2))
console.log(JSON.stringify({mode:apply?'apply':'dry-run',albums:raw.length,ready:jobs.length,variants:jobs.reduce((n,j)=>n+j.sizes.length,0),skipped:review.filter(r=>r.import_status.startsWith('skipped')).length,needs_review:review.filter(r=>r.import_status==='needs_review').length}))
if(!apply)process.exit(0)
let tags=await list('product-tags','product_tags')
const tagMap=new Map(tags.map(t=>[t.value,t.id]))
const report=savedReport
report.review=review.filter(r=>r.import_status!=='ready');await fs.writeFile(path.join(dir,'medusa-import-report.json'),JSON.stringify(report,null,2))
for(const job of jobs) {
 const tagIds=[]
 for(const value of job.tag_values){if(!tagMap.has(value)){const b=await api('/admin/product-tags',{value});tagMap.set(value,b.product_tag.id)}tagIds.push({id:tagMap.get(value)})}
 const payload={...job.payload,tags:tagIds};AdminCreateProduct.parse(payload)
 const {product}=job.resume_id ? await api(`/admin/products/${job.resume_id}`) : await api('/admin/products',payload)
 let entry=report.created.find(p=>p.id===product.id)
 if(!entry){entry={id:product.id,handle:product.handle,title:product.title,product_code:job.product_code,status:'draft',files:[]};report.created.push(entry)}
 const save=()=>fs.writeFile(path.join(dir,'medusa-import-report.json'),JSON.stringify(report,null,2));await save()
 for(const file of job.images_local){
  if(entry.files.some(f=>f.local_path===file))continue
  const form=new FormData();form.append('files',new File([await fs.readFile(file)],`${job.product_code}-${path.basename(file)}`,{type:'image/jpeg'}))
  const response=await fetch(backend+'/admin/uploads',{method:'POST',headers,body:form,signal:AbortSignal.timeout(60000)});const b=await response.json()
  if(!response.ok||!b.files?.[0]?.url)throw new Error(`Upload failed for ${job.product_code}: ${response.status}`)
  entry.files.push({local_path:file,...b.files[0]});await save()
 }
 const thumbnailFile=entry.files.find(f=>f.local_path===job.thumbnail_local)
 if(!thumbnailFile)throw new Error('Verified shoe-on-box photo was not uploaded')
 const orderedFiles=[thumbnailFile,...entry.files.filter(f=>f!==thumbnailFile)]
 await api(`/admin/products/${product.id}`,{thumbnail:thumbnailFile.url,images:orderedFiles.map(f=>({url:f.url}))})
 const {product:check}=await api(`/admin/products/${product.id}?fields=id,title,handle,status,thumbnail,metadata,*images,*tags,*categories,*sales_channels,*variants,*variants.prices,*options,collection_id,type_id,shipping_profile_id`)
 if(check.images.length!==8||check.variants.length!==job.sizes.length||!check.variants.every(v=>v.prices.some(p=>p.currency_code==='nzd'&&p.amount===160))||!check.variants.every(v=>job.sizes.some(s=>pumaLabel(s)===v.title)))throw new Error(`Read-back failed ${job.product_code}`)
 await api(`/admin/products/${product.id}`,{status:'published'})
 entry.status='published';entry.variant_count=check.variants.length;entry.verified_at=new Date().toISOString();await save()
 const row=review.find(r=>r.source_url===job.source_url);row.import_status='imported';row.medusa_product_id=product.id;await saveReview()
 console.log(`Published ${report.created.filter(p=>p.status==='published').length}: ${job.title} (${check.variants.length} sizes, 8 images, NZ$160)`)
}
report.finished_at=new Date().toISOString();await fs.writeFile(path.join(dir,'medusa-import-report.json'),JSON.stringify(report,null,2))
