import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedRequestOrigin } from '../src/lib/request-origin';

function request(origin?: string, host = 'localhost:3000', url = 'http://0.0.0.0:3000/api/store', extra: Record<string,string> = {}) {
  return { url, headers: new Headers({host, ...(origin ? {origin} : {}), ...extra}) };
}

test('accepts localhost when Next.js binds to 0.0.0.0', () => {
  assert.equal(isAllowedRequestOrigin(request('http://localhost:3000'), ''), true);
});
test('accepts the actual LAN host and port', () => {
  assert.equal(isAllowedRequestOrigin(request('http://192.168.1.20:3000', '192.168.1.20:3000'), ''), true);
});
test('rejects foreign origins, wrong ports, opaque origins and malformed values', () => {
  for (const origin of ['https://untrusted.example','http://localhost:3001','null','http://localhost:3000.evil.test','http://localhost:3000/path']) {
    assert.equal(isAllowedRequestOrigin(request(origin), ''), false, origin);
  }
});
test('does not trust client-supplied forwarding headers', () => {
  assert.equal(isAllowedRequestOrigin(request('https://untrusted.example', 'localhost:3000', undefined, {'x-forwarded-host':'untrusted.example','x-forwarded-proto':'https'}), ''), false);
});
test('supports an explicitly configured HTTPS origin behind a proxy', () => {
  assert.equal(isAllowedRequestOrigin(request('https://shop.example', 'internal:3000'), 'https://shop.example'), true);
  assert.equal(isAllowedRequestOrigin(request('https://untrusted.example', 'internal:3000'), 'https://shop.example'), false);
});
test('permits server-to-server requests without Origin and rejects malformed Host', () => {
  assert.equal(isAllowedRequestOrigin(request(), ''), true);
  assert.equal(isAllowedRequestOrigin(request('http://localhost:3000', 'evil.test/localhost:3000'), ''), false);
});
