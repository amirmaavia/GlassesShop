import test from 'node:test';
import assert from 'node:assert/strict';
import { supabaseConfig, supabaseRpc, SupabaseSetupError } from '../src/lib/server/supabase-http';

test('uses a server-only secret, never the public publishable key', () => {
  assert.equal(supabaseConfig({NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'}),null);
  assert.throws(()=>supabaseConfig({NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',SUPABASE_SECRET_KEY:'sb_publishable_test'}));
});

test('missing database objects become an actionable setup error without upstream details', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({code:'PGRST202',details:'sensitive upstream diagnostic'}, {status:404});
  try {
    await assert.rejects(supabaseRpc({url:'https://example.supabase.co',key:'sb_secret_test'},'aure_read_store'), error => {
      assert.ok(error instanceof SupabaseSetupError);
      assert.equal(error.code,'SUPABASE_SETUP_REQUIRED');
      assert.match(error.message,/SQL Editor/);
      assert.equal(error.message.includes('sensitive upstream diagnostic'),false);
      return true;
    });
  } finally { globalThis.fetch = original; }
});

test('authentication failures do not expose the key or upstream response', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({message:'upstream secret diagnostic'}, {status:401});
  try {
    await assert.rejects(supabaseRpc({url:'https://example.supabase.co',key:'sb_secret_private'},'aure_read_store'), error => {
      assert.ok(error instanceof Error);
      assert.match(error.message,/denied server access/);
      assert.equal(error.message.includes('sb_secret_private'),false);
      assert.equal(error.message.includes('upstream secret diagnostic'),false);
      return true;
    });
  } finally { globalThis.fetch = original; }
});
