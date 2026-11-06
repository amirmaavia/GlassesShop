import {Suspense} from 'react';
import {Catalog} from '@/components/catalog';
export const metadata={title:'Find your pair'};
export default function Page(){return <Suspense fallback={<div className="loading">Gathering your next favourites…</div>}><Catalog/></Suspense>}
