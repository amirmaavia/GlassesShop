import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
let cookie='';
async function request(action,data={},authenticated=true){const r=await fetch(base+'/api/store',{method:'POST',headers:{'Content-Type':'application/json',...(authenticated&&cookie?{cookie}:{})},body:JSON.stringify({action,...data})});const set=r.headers.get('set-cookie');if(set)cookie=set.split(';')[0];return {status:r.status,data:await r.json()};}
const publicResponse=await fetch(base+'/api/store');assert.equal(publicResponse.status,200);const store=await publicResponse.json();assert.equal(store.products.length>=24,true);assert.equal(store.me,null);assert.equal(store.orders.length,0);assert.equal('credentials' in store,false);
const forbidden=await fetch(base+'/api/store?admin=1');assert.equal(forbidden.status,403);
const email=`qa-${Date.now()}@example.test`;
const signup=await request('signup',{name:'Demo QA Customer',email,password:'Disposable-test-9384'});assert.equal(signup.status,200);assert.ok(cookie);
const privateStore=await (await fetch(base+'/api/store',{headers:{cookie}})).json();assert.equal(privateStore.me.email,email);assert.equal(privateStore.orders.length,0);
const admin=await request('admin:inventory',{id:store.products[0].id,delta:999,note:'unauthorised test'});assert.equal(admin.status,403);
const address={name:'Demo QA Customer',email,phone:'03001234567',street:'123 Synthetic Demo Street',city:'Lahore',postcode:'54000'};
const p=store.products.find(p=>p.stock>2&&p.price>=5000);const item={id:'qa-frame',product:{...p,price:1},color:p.colors[0],lens:{type:'Frame only',material:'Standard 1.50',coatings:[],tint:'Grey'},quantity:1};
const invalid=await request('checkout',{address,items:[{...item,quantity:99999}],payment:'Simulated payment',code:''});assert.equal(invalid.status,400);
const placed=await request('checkout',{address,items:[item],payment:'Simulated payment',code:'WELCOME10'});assert.equal(placed.status,200,JSON.stringify(placed.data));const order=placed.data.order;assert.equal(order.subtotal,p.price);assert.equal(order.discount,Math.round(p.price*.1));assert.equal(order.paymentStatus,'Simulated');assert.equal(order.items[0].product.price,p.price);
const after=await (await fetch(base+'/api/store',{headers:{cookie}})).json();assert.equal(after.orders.length,1);assert.equal(after.orders[0].id,order.id);assert.equal(after.products.find(x=>x.id===p.id).stock,p.stock-1);
const reuse=await request('checkout',{address,items:[item],payment:'Cash on delivery',code:'WELCOME10'});assert.equal(reuse.status,400);assert.match(reuse.data.error,/usage limit/);
await request('logout');const anonymous=await (await fetch(base+'/api/store')).json();assert.equal(anonymous.orders.length,0);assert.equal(anonymous.me,null);
const protectedRoute=await fetch(base+'/account',{redirect:'manual'});const protectedBody=await protectedRoute.text();assert.ok(protectedRoute.status===307||(protectedRoute.status===200&&protectedBody.includes('/auth/login?next=/account')&&!protectedBody.includes('account-stats')));
for(const route of ['/','/shop','/products/'+p.slug,'/cart','/checkout','/wishlist','/about','/contact','/help','/privacy','/terms','/auth/login']){const response=await fetch(base+route);assert.equal(response.status,200,route)}
console.log('PASS: catalogue, session, ownership, admin denial, authoritative pricing, checkout, inventory, promotion limits, logout, protected routes and 12 public routes.');
console.log('Synthetic test account and one clearly simulated order retained in local demo records.');
