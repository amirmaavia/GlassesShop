import assert from 'node:assert/strict';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const base='http://localhost:3000';
let cookie='';
async function request(action,value={}){
 const response=await fetch(base+'/api/store',{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...(cookie?{cookie}:{})},body:JSON.stringify({action,...value})});
 const body=await response.json();
 assert.equal(response.status,200,body.error||action+' failed');
 const session=response.headers.get('set-cookie');if(session)cookie=session.split(';')[0];
 return body;
}
async function admin(){const response=await fetch(base+'/api/store?admin=1',{headers:{cookie}});assert.equal(response.status,200);return response.json()}

await request('login',{email:process.env.DEMO_ADMIN_EMAIL,password:process.env.DEMO_ADMIN_PASSWORD});
let db=await admin();assert.equal(db.storage,'supabase','The app must use Supabase for this product.');
const collection="Kids' Eyewear";
if(!db.categories.some(c=>c.name===collection))await request('admin:category',{name:collection});
const name='Kids Panda White & Turquoise';
if(!db.products.some(p=>p.name===name)){
 await request('admin:product',{value:{name,category:collection,shape:'Round',material:'Not specified',price:1200,compareAt:0,colors:['White & Turquoise'],stock:40,featured:true,published:true,description:"An ivory-white children's round frame with turquoise textured temple grips and black hinge accents. The price is for the frame only; optional prescription lenses are charged separately. See the gallery for the original product photo.",size:'Not provided',images:['/products/kids-panda/studio.png','/products/kids-panda/original.jpeg'],imageAlt:'Kids Panda round eyeglasses with an ivory-white front, turquoise temple grips and black hinge details'}});
}
db=await admin();const product=db.products.find(p=>p.name===name);assert.ok(product);assert.equal(product.price,1200);assert.equal(product.stock,40);assert.equal(product.images.length,2);assert.equal(product.category,collection);
const publicResponse=await fetch(base+'/api/store');const store=await publicResponse.json();assert.ok(store.products.some(p=>p.id===product.id));assert.ok(store.categories.some(c=>c.name===collection));assert.equal('credentials' in store,false);
// Verify persistence with a second read directly from Supabase, independently of the app.
const remote=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/aure_read_store',{method:'POST',headers:{apikey:process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:'{}'});assert.equal(remote.status,200);const rows=await remote.json();assert.equal(rows[0].state.products.find(p=>p.id===product.id).price,1200);
for(const path of ['/', '/shop?collection='+encodeURIComponent(collection),'/products/'+product.slug,'/products/kids-panda/studio.png','/products/kids-panda/original.jpeg']){const response=await fetch(base+path);assert.equal(response.status,200,path)}
for(const path of ['/admin','/admin/products','/admin/categories']){const response=await fetch(base+path,{headers:{cookie}});assert.equal(response.status,200,path);const html=await response.text();assert.ok(!html.includes('NEXT_REDIRECT'),path+' should be accessible to the signed-in admin')}
const denied=await fetch(base+'/api/store?admin=1');assert.equal(denied.status,403);
console.log(JSON.stringify({verified:true,name:product.name,pricePKR:product.price,stock:product.stock,collection:product.category,productUrl:base+'/products/'+product.slug,collectionUrl:base+'/shop?collection='+encodeURIComponent(collection),adminUrl:base+'/admin/products',database:'Supabase',imagePaths:product.images},null,2));
