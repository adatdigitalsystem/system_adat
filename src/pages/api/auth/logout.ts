import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  await supabase.auth.signOut();
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });
  return redirect('/login', 302);
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  await supabase.auth.signOut();
  cookies.delete('sb-access-token', { path: '/' });
  cookies.delete('sb-refresh-token', { path: '/' });
  return redirect('/login', 302);
};