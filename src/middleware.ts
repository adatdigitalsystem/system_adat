import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

export const onRequest = defineMiddleware(async ({ request, cookies, redirect, url }, next) => {
  let accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  const currentPath = url.pathname;
  const secureCookie = url.protocol === 'https:';

  if (currentPath === '/login' || currentPath.startsWith('/_astro') || currentPath.startsWith('/api/auth')) {
    return next();
  }

  let user = accessToken
    ? (await supabase.auth.getUser(accessToken)).data.user
    : null;

  if (!user && refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (!error && data.session && data.user) {
      accessToken = data.session.access_token;
      user = data.user;
      cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        secure: secureCookie,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: data.session.expires_in,
      });
      cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        secure: secureCookie,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  }

  if (!user) {
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    return redirect('/login', 302);
  }

  const { data: anggota } = await supabase
    .from('anggota')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const role = (anggota?.role || 'KRAMA').toUpperCase().replace(/[\s_-]/g, '');

  // Proteksi Akses Berdasarkan Role
  if (currentPath.startsWith('/admin') && role !== 'ADMIN') {
    return redirect('/krama/dashboard', 302);
  }
  if (currentPath.startsWith('/bendahara') && role !== 'ADMIN' && role !== 'BENDAHARA') {
    return redirect('/krama/dashboard', 302);
  }
  if (currentPath.startsWith('/pengurus') && role !== 'ADMIN' && role !== 'PENGURUS') {
    return redirect('/krama/dashboard', 302);
  }
  const bendaharaReguView = currentPath === '/kepalaregu' && role === 'BENDAHARA';
  if (
    currentPath.startsWith('/kepalaregu')
    && role !== 'ADMIN'
    && role !== 'KEPALAREGU'
    && role !== 'KEPALAREGM'
    && role !== 'KEPALAREGUTEMPEKAN'
    && !bendaharaReguView
  ) {
    return redirect('/krama/dashboard', 302);
  }

  return next();
});