import assert from 'node:assert/strict'
import { pumaChart, pumaLabel, pumaSizesForRange, pumaImportMetadata, validatePumaProduct } from './lib/puma-import-profile.mjs'
assert.equal(pumaLabel(pumaChart.rows.find(r=>r.eu==='40.5')), 'M 8 / W 9.5')
assert.equal(pumaLabel(pumaChart.rows.find(r=>r.eu==='36')), 'M 4.5 / W 6')
assert.equal(pumaLabel(pumaChart.rows.find(r=>r.eu==='44')), 'M 10.5 / W 12')
assert.equal(pumaLabel(pumaChart.rows.find(r=>r.eu==='35.5')), 'M 4')
assert.equal(pumaLabel(pumaChart.rows.find(r=>r.eu==='45')), 'M 11.5')
assert.deepEqual(pumaSizesForRange('35.5-40').map(r=>r.eu), ['35.5','36','37','37.5','38','38.5','39','40'])
assert.equal(pumaSizesForRange('35.5-45').length, 16)
assert.throws(()=>pumaSizesForRange('no size range'), /Missing source/)
assert.equal(pumaChart.fit.down+pumaChart.fit.true+pumaChart.fit.up, 100)
assert.equal(pumaImportMetadata().fit_source, 'merchant_supplied')
assert.throws(()=>validatePumaProduct({metadata:pumaImportMetadata()}), /Missing required metadata/)
console.log('Puma sizing, missing conversion, source range and incomplete-import checks passed.')

const valid={title:'Puma test',handle:'puma-test',description:'Test',category_name:'Sneakers',type_name:'Standard Delivery',metadata:{...pumaImportMetadata(),model:'Speedcat',colourway:'Black White',primary_colour:'black',seo_title:'Puma test',meta_description:'Puma test',product_code:'123456-01',source_url:'https://example.com',stockx_search_query:'Puma test'},tag_values:['puma','puma-speedcat','colour:black'],sizes:[pumaChart.rows[0]],images_local:Array.from({length:8},(_,i)=>`${i+1}.jpg`),price_nzd:160}
assert.throws(()=>validatePumaProduct(valid), /shoe-on-box/)
assert.doesNotThrow(()=>validatePumaProduct({...valid,thumbnail_local:'8.jpg'}))
console.log('Explicit box-thumbnail selection required for future imports.')
