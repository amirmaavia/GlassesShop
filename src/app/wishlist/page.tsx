import {Suspense} from 'react';
import {Catalog} from '@/components/catalog';
export const metadata={title:'Your wishlist'};
export default function Page(){return <Suspense><Catalog wishlist/></Suspense>}
