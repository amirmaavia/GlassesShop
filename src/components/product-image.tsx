'use client';
import Image from 'next/image';
import {useState} from 'react';
import type {Product} from '@/lib/types';
import {FrameArt} from './frame-art';

export function ProductImage({product,color,angle=false,index,priority=false}:{product:Product;color:string;angle?:boolean;index?:number;priority?:boolean}){
 const [failedSrc,setFailedSrc]=useState('');
 const source=product.images?.[index??(angle?1:0)]||product.images?.[0];
 if(!source||failedSrc===source)return <FrameArt product={product} color={color} angle={angle}/>;
 return <span className="product-photograph"><Image src={source} alt={product.imageAlt||`${product.name} in ${color}`} width={1200} height={1200} sizes="(max-width: 650px) 90vw, (max-width: 1000px) 45vw, 40vw" loading={priority?'eager':'lazy'} onError={()=>setFailedSrc(source)}/></span>;
}
