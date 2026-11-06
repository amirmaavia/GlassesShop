'use client';
import { createContext,useCallback,useContext,useEffect,useState,type ReactNode } from 'react';
import type {Category,Discount,Order,Product,Profile,Settings} from '@/lib/types';
import {useBag} from '@/lib/store';
type Data={products:Product[];categories:Category[];discounts:Discount[];settings:Settings;orders:Order[];me:Profile|null};
const Context=createContext<{data:Data|null;refresh:()=>Promise<void>;toast:(message:string)=>void;error:string}>({data:null,refresh:async()=>{},toast:()=>{},error:''});
async function fetchStore():Promise<Data>{const r=await fetch('/api/store');const result=await r.json().catch(()=>null);if(!r.ok)throw Error(result?.error||'Unable to load the store. Please try again.');return result}
export function Providers({children}:{children:ReactNode}){
 const [data,setData]=useState<Data|null>(null);const [message,setMessage]=useState('');const [error,setError]=useState('');
 const refresh=useCallback(async()=>{try{setData(await fetchStore());setError('')}catch(e){setError((e as Error).message)}},[]);
 useEffect(()=>{void useBag.persist.rehydrate()},[]);
 useEffect(()=>{let active=true;fetchStore().then(value=>{if(active)setData(value)}).catch(e=>{if(active)setError((e as Error).message)});return()=>{active=false}},[]);
 useEffect(()=>{if(message){const t=setTimeout(()=>setMessage(''),4000);return()=>clearTimeout(t)}},[message]);
 useEffect(()=>{
  let prior:HTMLElement|null=null;let modal:HTMLElement|null=null;
  const focusables=(root:HTMLElement)=>Array.from(root.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')).filter(el=>el.getClientRects().length>0);
  const observe=()=>{const overlays=document.querySelectorAll<HTMLElement>('.overlay');const current=overlays[overlays.length-1]||null;if(current!==modal){if(current){prior=document.activeElement as HTMLElement;modal=current;focusables(current)[0]?.focus();document.body.style.overflow='hidden'}else{modal=null;document.body.style.overflow='';prior?.focus()}}};
  const keys=(e:KeyboardEvent)=>{if(!modal)return;if(e.key==='Escape'){modal.querySelector<HTMLButtonElement>('.close')?.click();return}if(e.key==='Tab'){const items=focusables(modal);const first=items[0],last=items[items.length-1];if(!first){e.preventDefault();return}if(e.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){e.preventDefault();last.focus()}else if(!e.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){e.preventDefault();first.focus()}}};
  const observer=new MutationObserver(observe);observer.observe(document.body,{childList:true,subtree:true});document.addEventListener('keydown',keys);return()=>{observer.disconnect();document.removeEventListener('keydown',keys);document.body.style.overflow=''};
 },[]);
 return <Context.Provider value={{data,refresh,toast:setMessage,error}}>{error&&<div className="error" role="alert">{error}<button className="underlink" onClick={()=>void refresh()}>Try again</button></div>}{children}{message&&<div className="toast" role="status">{message}<button onClick={()=>setMessage('')} aria-label="Dismiss notification">×</button></div>}</Context.Provider>;
}
export const useStore=()=>useContext(Context);
