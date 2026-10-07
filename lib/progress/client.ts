import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* The anon key is public by design: the database only allows reads with it.
   The one exception is the owner, signed in from /progress?edit, who may
   change project order — so the session is kept, and picked up from the
   login link's URL when it lands. Visitors never sign in, so for them this
   stays a read-only client. */
let client: SupabaseClient | null | undefined;

export function progressClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client =
    url && key
      ? createClient(url, key, { auth: { persistSession: true, detectSessionInUrl: true } })
      : null;
  return client;
}
