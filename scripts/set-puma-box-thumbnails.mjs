import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=path.resolve(import.meta.dirname,'..'),dir=path.resolve(root,'../medusa-imports/yupoo-puma-585242-2026-09-04')
const report=JSON.parse(await fs.readFile(path.join(dir,'medusa-import-report.json'),'utf8'))
const key=(await fs.readFile(path.join(root,'.image-upload.env'),'utf8')).match(/^MEDUSA_ADMIN_API_KEY=(.+)$/m)[1].trim()
const api=async(route,body)=>{const r=await fetch('https://appealing-quince-change.medusajs.app'+route,{method:body?'POST':'GET',headers:{Authorization:`Basic ${key}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});assert(r.ok,`${r.status} ${route}`);return r.json()}
const research=JSON.parse(await fs.readFile(path.join(dir,'product-research.json'),'utf8'))
const result={updated:[],missing_box_photo:['398846-09'],started_at:new Date().toISOString()}
for(const entry of report.created){
 const index=entry.product_code==='398846-09'?null:entry.product_code==='403688-03'?3:8
 const info=Object.values(research).find(r=>r.product_code===entry.product_code)
 if(info){info.thumbnail_image_index=index;info.thumbnail_selection=index?'visually_verified_shoe_on_box':'no_box_photo_in_source_album'}
 if(!index)continue
 const photo=entry.files[index-1];assert(photo)
 const {product:before}=await api(`/admin/products/${entry.id}?fields=id,thumbnail,metadata,*images`)
 const selected=before.images.find(i=>i.url===photo.url);assert(selected)
 const ordered=[selected,...before.images.filter(i=>i.url!==selected.url)]
 await api(`/admin/products/${entry.id}`,{thumbnail:selected.url,images:ordered.map(i=>({id:i.id,url:i.url})),metadata:{...before.metadata,thumbnail_selection:'shoe_on_box',thumbnail_source_image:index}})
 const {product:after}=await api(`/admin/products/${entry.id}?fields=id,thumbnail,*images`)
 assert.equal(after.thumbnail,selected.url);assert.equal(after.images[0].url,selected.url);assert.equal(after.images.length,before.images.length)
 assert.deepEqual(new Set(after.images.map(i=>i.url)),new Set(before.images.map(i=>i.url)))
 entry.thumbnail=selected.url;entry.thumbnail_source_image=index
 result.updated.push({id:entry.id,handle:entry.handle,product_code:entry.product_code,thumbnail:selected.url,source_image:index,verified_at:new Date().toISOString()})
 await fs.writeFile(path.join(dir,'box-thumbnail-update.json'),JSON.stringify(result,null,2));console.log(`Verified ${result.updated.length}: ${entry.product_code}`)
}
await fs.writeFile(path.join(dir,'medusa-import-report.json'),JSON.stringify(report,null,2))
await fs.writeFile(path.join(dir,'product-research.json'),JSON.stringify(research,null,2))
console.log(JSON.stringify({updated:result.updated.length,missing:result.missing_box_photo}))
