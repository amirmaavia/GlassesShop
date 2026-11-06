import 'server-only';
import type { Database } from '@/lib/types';
import { seed } from '@/data/demo';
import { supabaseConfig, supabaseRpc } from './supabase-http';
import type { Repository } from './repository';

type Snapshot = { revision: number; state: Database | null };

/** Fresh live stores start empty. Synthetic people, credentials and orders are never imported. */
export function initialLiveStore(): Database {
  return {
    products: [], categories: [], orders: [], customers: [], discounts: [],
    tickets: [], movements: [], audit: [], credentials: [],
    settings: { ...structuredClone(seed.settings), newsletter: [] },
  };
}

export function createSupabaseRepository(): Repository {
  function config() {
    const value = supabaseConfig();
    if (!value) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local to use Supabase.');
    return value;
  }
  async function snapshot(): Promise<Snapshot> {
    const rows = await supabaseRpc<Snapshot[]>(config(), 'aure_read_store');
    if (rows.length !== 1) throw new Error('The Supabase store has not been initialised. Apply the live-store migration.');
    return rows[0];
  }
  return {
    async read() {
      const row = await snapshot();
      return row.state ?? initialLiveStore();
    },
    async mutate<T>(fn: (db: Database) => T): Promise<T> {
      // The revision comparison is atomic in Postgres. On conflict, repeat all validation
      // against the latest prices, stock, coupon usage and account records.
      for (let attempt = 0; attempt < 5; attempt++) {
        const row = await snapshot();
        const state = row.state ?? initialLiveStore();
        const result = fn(state);
        const committed = await supabaseRpc<boolean>(config(), 'aure_commit_store', {
          expected_revision: row.revision, next_state: state,
        });
        if (committed) return result;
      }
      throw new Error('The store changed while saving. Please try again.');
    },
  };
}
