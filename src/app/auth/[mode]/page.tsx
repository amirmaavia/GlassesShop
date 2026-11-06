import {Suspense} from 'react';
import {AuthForm} from '@/components/auth-form';
export default async function Page({params}:{params:Promise<{mode:string}>}){return <Suspense><AuthForm mode={(await params).mode}/></Suspense>}
