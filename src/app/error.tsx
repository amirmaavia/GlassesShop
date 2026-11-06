'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="empty"><h1>A brief interruption.</h1><p>The page could not load. Try again to get back to your frames.</p><button className="button" onClick={reset}>Try again</button></div>}
