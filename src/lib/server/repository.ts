import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { seed } from '@/data/demo';
import type { Database } from '@/lib/types';
import { createSupabaseRepository } from './supabase-repository';
export interface Repository {read():Promise<Database>; mutate<T>(fn:(db:Database)=>T):Promise<T>}
const file=path.join(process.cwd(),'data','store.json');let queue:Promise<unknown>=Promise.resolve();
async function read(){try{return JSON.parse(await fs.readFile(file,'utf8')) as Database}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;return structuredClone(seed)}}
const localRepository:Repository={read,mutate<T>(fn:(db:Database)=>T){const task=queue.then(async()=>{const db=await read();const result=fn(db);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file+'.tmp',JSON.stringify(db,null,2));await fs.rename(file+'.tmp',file);return result});queue=task.catch(()=>{});return task}};
export function storageBackend(): 'local' | 'supabase' {
  const mode=process.env.DATA_BACKEND;
  if(mode&&mode!=='local'&&mode!=='supabase')throw Error('DATA_BACKEND must be local or supabase.');
  return mode==='supabase'||(!mode&&Boolean(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY))?'supabase':'local';
}
const remoteRepository=createSupabaseRepository();
export const repository:Repository={
  read:()=> (storageBackend()==='supabase'?remoteRepository:localRepository).read(),
  mutate:<T>(fn:(db:Database)=>T)=>(storageBackend()==='supabase'?remoteRepository:localRepository).mutate(fn),
};
