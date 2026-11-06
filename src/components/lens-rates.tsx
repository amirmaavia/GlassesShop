'use client';
import {useState} from 'react';
import Link from 'next/link';
import type {LensPricing} from '@/lib/types';
import {getLensPricing} from '@/lib/pricing';

export function LensRates({config,save}:{config?:LensPricing;save:(value:LensPricing)=>Promise<boolean>}) {
 const [rates,setRates]=useState(()=>getLensPricing(config));
 const [busy,setBusy]=useState(false);
 const [saved,setSaved]=useState(false);
 return <section className="admin-panel settings-panel">
  <form onSubmit={async e=>{e.preventDefault();setBusy(true);setSaved(false);try{if(await save(rates))setSaved(true)}finally{setBusy(false)}}}>
   <h2>Lens prices & available options</h2>
   <p className="muted">Set the additional price per pair in PKR. Customers pay the frame price plus their lens, material and coating upgrades. Changes apply to bags and new orders; existing orders keep their saved prices.</p>
   <p className="panel-note">Change individual frame prices in <Link className="text-link" href="/admin/products">Products</Link>. Frame only is always free. Standard 1.50 stays available as the default material.</p>
   {(['types','materials','coatings'] as const).map(group=><fieldset key={group} disabled={busy} style={{border:0,padding:0,margin:'28px 0'}}>
    <legend><h3>{group==='types'?'Lens types':group==='materials'?'Lens materials':'Coatings & upgrades'}</h3></legend>
    <div className="form-grid">{Object.entries(rates[group]).map(([name,price])=>{
     const fixed=group==='types'&&name==='Frame only';
     const required=fixed||(group==='materials'&&name==='Standard 1.50');
     const enabled=!rates.disabled[group].includes(name);
     return <div key={name}>
      <label className="field">{name} (PKR)<input aria-label={`${name} price (PKR)`} type="number" min="0" max="1000000" step="0.01" required value={Number.isNaN(price)?'':price} readOnly={fixed} onChange={e=>{setSaved(false);setRates({...rates,[group]:{...rates[group],[name]:e.target.value===''?NaN:Number(e.target.value)}})}}/></label>
      <label className="check"><input type="checkbox" checked={enabled} disabled={required} onChange={e=>{setSaved(false);setRates({...rates,disabled:{...rates.disabled,[group]:e.target.checked?rates.disabled[group].filter(v=>v!==name):[...rates.disabled[group],name]}})}}/> Available for orders{required?' (required)':''}</label>
     </div>;
    })}</div>
   </fieldset>)}
   {saved&&<p className="notice" role="status">Lens rates saved. Your storefront now uses these prices and options.</p>}
   <button className="button" disabled={busy}>{busy?'Saving…':'Save lens rates'}</button>
  </form>
 </section>;
}
