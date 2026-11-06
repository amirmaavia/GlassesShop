import {redirect} from 'next/navigation';
import {user} from '@/lib/server/auth';
import {Account} from '@/components/account';
export default async function Page({params}:{params:Promise<{section?:string[]}>}){const me=await user();if(!me)redirect('/auth/login?next=/account');return <Account section={(await params).section||[]}/>}
