/** Validate the browser-facing Host, not the address the server is bound to. */
export function isAllowedRequestOrigin(
  request: Pick<Request, 'headers' | 'url'>,
  configuredOrigin = process.env.APP_ORIGIN,
): boolean {
  const origin = request.headers.get('origin');
  // Non-browser API clients do not send Origin. Authentication still applies.
  if (!origin) return true;
  try {
    const parsedOrigin = new URL(origin);
    if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.origin !== origin) return false;
    if (configuredOrigin && new URL(configuredOrigin).origin === origin) return true;
    const expected = new URL(request.url);
    const host = request.headers.get('host');
    if (host) {
      // Do not accept a list, userinfo, path or untrusted forwarded-host value.
      if (/[\s,@/\\?#]/.test(host)) return false;
      const publicUrl = new URL(`${expected.protocol}//${host}`);
      return origin === publicUrl.origin;
    }
    return origin === expected.origin;
  } catch {
    return false;
  }
}
