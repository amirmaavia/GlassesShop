import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { Shell } from '@/components/shell';
import './globals.css';
export const metadata:Metadata={title:{default:'Auré Optics — A clearer view. A little more you.',template:'%s | Auré Optics'},description:'Thoughtfully designed eyewear, personalised lenses and a fresh perspective. Explore the Auré Optics Pakistani-market demo.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Providers><Shell>{children}</Shell></Providers></body></html>}
