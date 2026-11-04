import { createClient } from '@supabase/supabase-js';

export function createSupabaseAdminClient() {
  // Mendukung kunci rahasia baru (SUPABASE_SECRET_KEY) atau lama (SUPABASE_SERVICE_ROLE_KEY)
  const serviceRoleKey = import.meta.env.SUPABASE_SECRET_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey) {
    throw new Error('Konfigurasi server SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY belum tersedia.');
  }
  if (!supabaseUrl) {
    throw new Error('Konfigurasi PUBLIC_SUPABASE_URL belum tersedia.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
