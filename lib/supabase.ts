import { createClient } from "@supabase/supabase-js";

// This app is a static export with no server, so the Supabase client runs
// entirely in the browser. The URL and publishable key below are safe to
// ship in client code by design — access is governed by row-level security
// policies on the database, not by keeping the key secret.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://wlgqhfhyrpqvcbzdynna.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_wI578u2Or6rTUrl8zQ6VvA_336cICaI";

export const supabase = createClient(supabaseUrl, supabaseKey);
