import {existsSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
if(existsSync('.env.local')){console.log('.env.local already exists; existing configuration was preserved.');}
else{writeFileSync('.env.local',`SESSION_SECRET=${randomBytes(48).toString('hex')}\nDEMO_ADMIN_EMAIL=admin@aure.demo\nDEMO_ADMIN_PASSWORD=${randomBytes(18).toString('base64url')}\n`);console.log('Created .env.local with a stable session secret and unique local admin password. Read that file to sign in.');}
