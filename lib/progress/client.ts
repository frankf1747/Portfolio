import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* The anon key is public by design: the database only allows reads with it. */
let client: SupabaseClient | null | undefined;

export function progressClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}
