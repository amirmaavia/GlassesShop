import type { CartItem, Discount, LensConfig, LensPricing, Settings } from './types';
export const lensTypes:Record<string,number>={'Frame only':0,'Single vision':1800,'Reading':1500,'Progressive':6500,'Non-prescription clear':900,'Blue-light filtering':2200,'Sunglasses':2500,'Photochromic':4500};
export const materials:Record<string,number>={'Standard 1.50':0,'Polycarbonate 1.59':2000,'High-index 1.60':3500,'High-index 1.67':5500};
export const coatings:Record<string,number>={'Anti-reflective':800,'Scratch-resistant':500,'UV protection':600,'Blue-light filter':1200,'Polarized':2000};
export const requiresRx=(type:string)=>['Single vision','Reading','Progressive'].includes(type);
export function getLensPricing(config?:LensPricing):LensPricing {
 return {types:{...lensTypes,...config?.types},materials:{...materials,...config?.materials},coatings:{...coatings,...config?.coatings},disabled:config?.disabled??{types:[],materials:[],coatings:[]}};
}
export function lensPrice(lens:LensConfig,config?:LensPricing){const rates=getLensPricing(config);return lens.type==='Frame only'?0:(rates.types[lens.type]??0)+(rates.materials[lens.material]??0)+lens.coatings.reduce((n,c)=>n+(rates.coatings[c]??0),0)}
export function itemPrice(item:CartItem,config?:LensPricing){return config===undefined&&item.unitPrice!==undefined?item.unitPrice:item.product.price+lensPrice(item.lens,config)}
export const money=(n:number)=>`Rs. ${Math.round(n).toLocaleString('en-PK')}`;
export function calculateCart(items:CartItem[],settings:Settings,promo?:Discount,now=new Date(),customerUses=0){
 const subtotal=items.reduce((n,i)=>n+(i.product.price+lensPrice(i.lens,settings.lensPricing))*i.quantity,0);let error='';let discount=0;
 if(promo){if(!promo.active||now<new Date(promo.start)||now>new Date(promo.end+'T23:59:59Z'))error='This code is not currently active.';else if(promo.used>=promo.limit||customerUses>=promo.perCustomer)error='This code has reached its usage limit.';else if(subtotal<promo.min)error=`Spend ${money(promo.min)} to use this code.`;else {const eligible=items.filter(i=>promo.category==='All'||i.product.category===promo.category).reduce((n,i)=>n+i.product.price*i.quantity,0);if(!eligible)error='This code does not apply to these frames.';else discount=Math.min(eligible,Math.round(eligible*promo.percent/100)+promo.fixed)}}
 const shipping=items.length===0||subtotal-discount>=settings.freeShipping||(!error&&promo?.freeShipping)?0:settings.shipping;const tax=Math.round((subtotal-discount)*settings.tax/100);
 return {subtotal,discount,shipping,tax,total:subtotal-discount+shipping+tax,error};
}
export function validateLens(l:LensConfig,category:string,config?:LensPricing){
 const rates=getLensPricing(config);
 if(rates.disabled.types.includes(l.type)||(l.type!=='Frame only'&&(rates.disabled.materials.includes(l.material)||l.coatings.some(c=>rates.disabled.coatings.includes(c)))))return 'A selected lens option is no longer available. Please edit your lenses.';
 if(new Set(l.coatings).size!==l.coatings.length)return 'Choose each coating only once.';
 if(!(l.type in lensTypes)||!(l.material in materials)||l.coatings.some(c=>!(c in coatings)))return 'Choose valid lens options.';
 if(l.coatings.includes('Polarized')&&l.type!=='Sunglasses')return 'Polarization requires sunglasses lenses.';
 if(category==='Sunglasses'&&!['Frame only','Sunglasses','Photochromic'].includes(l.type))return 'Choose a compatible sunglasses lens.';
 if(l.type==='Blue-light filtering'&&l.coatings.includes('Blue-light filter'))return 'Blue-light filtering is already included.';
 if(!requiresRx(l.type))return '';
 const rx=l.prescription;if(!rx)return 'Choose how to provide your prescription.';
 if(rx.mode==='later')return '';
 if(rx.mode==='upload')return rx.fileName&&rx.fileSize&&rx.fileSize<=5*1024*1024&&/\.(pdf|png|jpe?g)$/i.test(rx.fileName)?'':'Choose a PDF, PNG or JPG under 5 MB.';
 if(rx.mode!=='manual')return 'Choose a prescription method.';
 for(const eye of [rx.right,rx.left]){if(eye.sph===''||!Number.isFinite(Number(eye.sph))||Math.abs(Number(eye.sph))>20||Number(eye.sph)*4%1)return 'Enter SPH between -20 and +20 in 0.25 steps.';if(eye.cyl!==''&&(!Number.isFinite(Number(eye.cyl))||Math.abs(Number(eye.cyl))>6||Number(eye.cyl)*4%1))return 'Enter CYL between -6 and +6 in 0.25 steps.';if(Number(eye.cyl)!==0&&(eye.axis===''||!Number.isInteger(Number(eye.axis))||Number(eye.axis)<1||Number(eye.axis)>180))return 'Axis must be between 1 and 180 when CYL is provided.';if(l.type==='Progressive'&&(eye.add===''||Number(eye.add)<0.5||Number(eye.add)>4))return 'Progressive lenses require ADD between 0.50 and 4.00.';}
 if(rx.pd===''||Number(rx.pd)<(rx.dual?20:40)||Number(rx.pd)>(rx.dual?40:80)||!Number.isFinite(Number(rx.pd)))return 'Enter a valid pupillary distance.';
 if(rx.dual&&(rx.pdLeft===''||Number(rx.pdLeft)<20||Number(rx.pdLeft)>40||!Number.isFinite(Number(rx.pdLeft))))return 'Enter left PD between 20 and 40 mm.';return '';
}
