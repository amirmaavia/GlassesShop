import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { repository } from './repository';
const processState=globalThis as typeof globalThis&{aureSessionSecret?:string};
const ephemeral=processState.aureSessionSecret??=randomBytes(48).toString('hex');
const secret=()=>process.env.SESSION_SECRET||ephemeral;
export function hash(password:string,salt:string){return scryptSync(password,salt,64).toString('hex')}
export function matches(password:string,salt:string,expected:string){const actual=Buffer.from(hash(password,salt),'hex');const target=Buffer.from(expected,'hex');return target.length===actual.length&&timingSafeEqual(actual,target)}
export async function setSession(id:string){const payload=Buffer.from(JSON.stringify({id,exp:Date.now()+86400000*7})).toString('base64url');const sig=createHmac('sha256',secret()).update(payload).digest('base64url');(await cookies()).set('aure-session',`${payload}.${sig}`,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:604800})}
export async function user(){try{const token=(await cookies()).get('aure-session')?.value;if(!token)return null;const [payload,sig]=token.split('.');const expected=createHmac('sha256',secret()).update(payload).digest('base64url');if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;const session=JSON.parse(Buffer.from(payload,'base64url').toString());if(session.exp<Date.now())return null;const db=await repository.read();return db.customers.find(p=>p.id===session.id&&p.active)||null}catch{return null}}
