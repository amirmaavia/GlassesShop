import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateCart,getLensPricing,itemPrice,lensPrice,validateLens} from '../src/lib/pricing';
import {seed,demoProducts} from '../src/data/demo';
import type {CartItem,LensConfig} from '../src/lib/types';
const date=new Date('2026-10-24T00:00:00Z');
const base:LensConfig={type:'Frame only',material:'Standard 1.50',coatings:[],tint:'Grey'};
const item:CartItem={id:'a',product:demoProducts[0],color:'Black',quantity:1,lens:base};
test('sale frame price is not reduced by compare-at price again',()=>{assert.equal(itemPrice(item),6500);assert.equal(calculateCart([item],seed.settings,undefined,date).total,6800)});
test('percentage promotion excludes lens upgrades and applies quantity once',()=>{const i={...item,quantity:2,lens:{...base,type:'Single vision',material:'High-index 1.60',coatings:['Anti-reflective']}};assert.equal(lensPrice(i.lens),6100);const result=calculateCart([i],seed.settings,seed.discounts[0],date);assert.equal(result.subtotal,25200);assert.equal(result.discount,1300);assert.equal(result.total,23900)});
test('shipping threshold uses amount after discounts',()=>{const i={...item,product:{...item.product,price:10000}};const result=calculateCart([i],seed.settings,seed.discounts[0],date);assert.equal(result.discount,1000);assert.equal(result.shipping,300)});
test('invalid, expired, exhausted and category-ineligible promotions do not discount',()=>{for(const promo of [{...seed.discounts[0],active:false},{...seed.discounts[0],end:'2025-01-01'},{...seed.discounts[0],used:1000},{...seed.discounts[0],category:'Sunglasses'}]){const result=calculateCart([item],seed.settings,promo,date);assert.ok(result.error);assert.equal(result.discount,0)}});
test('minimum spend and per-customer limits enforced',()=>{assert.ok(calculateCart([item],seed.settings,{...seed.discounts[0],min:10000},date).error);assert.ok(calculateCart([item],seed.settings,seed.discounts[0],date,1).error)});
test('frame-only lenses ignore hidden material and coating prices',()=>{assert.equal(lensPrice({...base,material:'High-index 1.67',coatings:['Polarized']}),0)});
test('cylinder requires axis and progressive lenses require ADD',()=>{const lens:LensConfig={...base,type:'Progressive',prescription:{mode:'manual',right:{sph:'-1',cyl:'-1',axis:'',add:'2'},left:{sph:'-1',cyl:'0',axis:'',add:'2'},pd:'62',pdLeft:'',dual:false}};assert.match(validateLens(lens,'Eyeglasses'),/Axis/);lens.prescription!.right.axis='90';lens.prescription!.left.add='';assert.match(validateLens(lens,'Eyeglasses'),/ADD/);lens.prescription!.left.add='2';assert.equal(validateLens(lens,'Eyeglasses'),'')});
test('incompatible coatings, invalid PD and upload formats rejected',()=>{assert.match(validateLens({...base,type:'Single vision',coatings:['Polarized']},'Eyeglasses'),/Polarization/);const rx={mode:'upload',right:{sph:'',cyl:'',axis:'',add:''},left:{sph:'',cyl:'',axis:'',add:''},pd:'',pdLeft:'',dual:false,fileName:'script.exe',fileSize:100};assert.ok(validateLens({...base,type:'Single vision',prescription:rx},'Eyeglasses'));rx.fileName='prescription.pdf';assert.equal(validateLens({...base,type:'Single vision',prescription:rx},'Eyeglasses'),'')});


test('configured lens prices apply consistently to bag totals',()=>{
 const rates=getLensPricing();rates.types.Reading=3000;rates.materials['High-index 1.60']=4000;rates.coatings['Anti-reflective']=1000;
 const lens={...base,type:'Reading',material:'High-index 1.60',coatings:['Anti-reflective'],prescription:{mode:'later'} as LensConfig['prescription']};
 const priced={...item,lens,quantity:2};
 assert.equal(lensPrice(lens,rates),8000);
 assert.equal(itemPrice(priced,rates),14500);
 assert.equal(calculateCart([priced],{...seed.settings,lensPricing:rates}).subtotal,29000);
 assert.equal(validateLens(lens,'Eyeglasses',rates),'');
});
test('disabled options and duplicate coatings are rejected at checkout',()=>{
 const rates=getLensPricing();const lens={...base,type:'Reading',coatings:['Anti-reflective'],prescription:{mode:'later'} as LensConfig['prescription']};
 for(const group of ['types','materials','coatings'] as const){const config=structuredClone(rates);config.disabled[group]=[group==='types'?lens.type:group==='materials'?lens.material:lens.coatings[0]];assert.match(validateLens(lens,'Eyeglasses',config),/no longer available/)}
 assert.match(validateLens({...lens,coatings:['Anti-reflective','Anti-reflective']},'Eyeglasses'),/only once/);
});
test('saved order unit prices survive rate changes while bags use current rates',()=>{
 const orderItem={...item,lens:{...base,type:'Non-prescription clear'},unitPrice:7400};
 const rates=getLensPricing();rates.types['Non-prescription clear']=2000;
 assert.equal(itemPrice(orderItem),7400);
 assert.equal(itemPrice(orderItem,rates),8500);
 assert.equal(calculateCart([orderItem],{...seed.settings,lensPricing:rates}).subtotal,8500);
});
