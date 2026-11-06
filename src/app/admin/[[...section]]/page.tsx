import {redirect} from 'next/navigation';
import {user} from '@/lib/server/auth';
import {Admin} from '@/components/admin';
export default async function Page({params}:{params:Promise<{section?:string[]}>}){const me=await user();if(!me)redirect('/auth/login?next=/admin');if(me.role!=='admin')redirect('/account');return <Admin section={(await params).section||[]}/>}
