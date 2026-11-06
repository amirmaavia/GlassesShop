'use client';
import Image from 'next/image';
import {useState} from 'react';
import {FrameArt} from './frame-art';
export function EditorialImage({src,alt,priority=false,sizes}:{src:string;alt:string;priority?:boolean;sizes:string}){const [failed,setFailed]=useState(false);return failed?<div className="editorial-fallback"><FrameArt product={{shape:'Round',category:'Eyeglasses',material:'Acetate'}} color="Tortoise" angle/></div>:<Image src={src} alt={alt} fill priority={priority} sizes={sizes} onError={()=>setFailed(true)}/>}
