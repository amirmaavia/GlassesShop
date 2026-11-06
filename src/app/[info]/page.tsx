import {notFound} from 'next/navigation';
import {InfoPage} from '@/components/info-page';
export default async function Page({params}:{params:Promise<{info:string}>}){const {info}=await params;if(!['about','contact','help','privacy','terms'].includes(info))notFound();return <InfoPage page={info}/>}
