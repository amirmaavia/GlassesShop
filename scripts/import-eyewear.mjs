import assert from 'node:assert/strict';
import {readFileSync,existsSync,writeFileSync,mkdirSync} from 'node:fs';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
const catalogue=JSON.parse(readFileSync('src/data/imported-eyewear.json','utf8'));
let cookie='';
async function action(action,data={}){
 const response=await fetch(base+'/api/store',{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...(cookie?{cookie}:{})},body:JSON.stringify({action,...data})});
 const result=await response.json();assert.equal(response.status,200,result.error||action);
 const session=response.headers.get('set-cookie');if(session)cookie=session.split(';')[0];
 return result;
}
async function read(){const response=await fetch(base+'/api/store?admin=1',{headers:{cookie}});assert.equal(response.status,200);return response.json()}
for(const row of catalogue)assert.ok(existsSync('public'+row.value.images[0]),'Missing cutout: '+row.value.name);
await action('login',{email:process.env.DEMO_ADMIN_EMAIL,password:process.env.DEMO_ADMIN_PASSWORD});
let db=await read();
mkdirSync('data/import-backups',{recursive:true});
// Retain the pre-import catalogue locally so product edits can be reviewed or restored.
writeFileSync(`data/import-backups/eyewear-${Date.now()}.json`,JSON.stringify({products:db.products,categories:db.categories},null,2));
for(const name of [...new Set(catalogue.map(row=>row.value.category))]){
 if(!db.categories.some(c=>c.name===name))await action('admin:category',{name});
}
for(const {value} of catalogue){
 const existing=db.products.find(p=>p.images?.includes(value.images[0])||p.name===value.name);
 // Re-running the import preserves the administrator's prices, stock and publication choices.
 const saved=existing?{...value,price:existing.price,stock:existing.stock,published:existing.published,featured:existing.featured}:value;
 await action('admin:product',{id:existing?.id,value:saved});
}
const panda=db.products.find(p=>p.name==='Kids Panda White & Turquoise');
if(panda)await action('admin:product',{id:panda.id,value:{...panda,images:['/products/kids-panda/studio.png'],description:panda.description.replace('See the gallery for the original product photo.','Product image shows the frame without a promotional banner.')}});
db=await read();
for(const row of catalogue){const product=db.products.find(p=>p.images?.includes(row.value.images[0]));assert.ok(product);assert.equal(product.category,row.value.category)}
const store=await (await fetch(base+'/api/store')).json();
for(const row of catalogue){const saved=db.products.find(p=>p.images?.includes(row.value.images[0]));if(saved.published)assert.ok(store.products.some(p=>p.id===saved.id))}
console.log(JSON.stringify({imported:catalogue.length,totalPublished:store.products.length,backend:db.storage,newProductStock:0,provisionalPricesPKR:{kids:1200,eyeglasses:2500,sunglasses:3500}},null,2));
