/** Server-side Data API transport. Never import from a client component. */
export type SupabaseConfig = { url: string; key: string };

export class SupabaseSetupError extends Error {
  readonly code = 'SUPABASE_SETUP_REQUIRED';
  constructor() {
    super('Supabase setup is incomplete. Run supabase/migrations/202610300001_live_store.sql in your Supabase project’s SQL Editor, then refresh this page.');
    this.name = 'SupabaseSetupError';
  }
}

export function supabaseConfig(env: Record<string, string | undefined> = process.env): SupabaseConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!url || !key) return null;
  if (!key.startsWith('sb_secret_') && !key.startsWith('eyJ')) {
    throw new Error('Supabase requires a server secret key, not a publishable key.');
  }
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    throw new Error('The Supabase project URL must use HTTPS.');
  }
  return { url: url.replace(/\/$/, ''), key };
}

export async function supabaseRpc<T>(config: SupabaseConfig, name: string, args: Record<string, unknown> = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: config.key,
        ...(config.key.startsWith('eyJ') ? { Authorization: `Bearer ${config.key}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error('Unable to reach Supabase. Check the project URL and network connection.');
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Supabase denied server access. Check SUPABASE_SECRET_KEY and database permissions.');
    }
    const error = await response.json().catch(() => ({})) as { code?: string };
    if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(error.code || '')) {
      throw new SupabaseSetupError();
    }
    throw new Error(`Supabase operation failed (${response.status}). No local fallback was used.`);
  }
  return response.json() as Promise<T>;
}
