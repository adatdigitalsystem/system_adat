import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

export const onRequest = defineMiddleware(async ({ request, cookies, redirect, url }, next) => {
  let accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  const currentPath = url.pathname;
  const secureCookie = url.protocol === 'https:';

  // 1. Abaikan halaman publik, file asset, gambar, dan API auth agar tidak membebani worker
  if (
    currentPath === '/login' ||
    currentPath.startsWith('/_astro') ||
    currentPath.startsWith('/api/auth') ||
    currentPath.includes('.') // Mengabaikan file statis (css, js, gambar, favicon)
  ) {
    return next();
  }

  // Jika tidak ada token sama sekali, langsung tendang ke /login (hemat resource tanpa fetch)
  if (!accessToken && !refreshToken) {
    return redirect('/login', 302);
  }

  let user = null;
  try {
    if (accessToken) {
      const userRes = await supabase.auth.getUser(accessToken);
      user = userRes.data.user;
    }

    // Jika access token invalid/expired tapi ada refresh token
    if (!user && refreshToken) {
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
      if (!error && data.session && data.user) {
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
  } catch (err) {
    // Jika gagal terhubung ke supabase, anggap unauthorized untuk mencegah worker crash
    user = null;
  }

  if (!user) {
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    return redirect('/login', 302);
  }

  // Pengecekan role ke database (hanya jika mengakses halaman khusus role)
  const isRestrictedPath = 
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/bendahara') ||
    currentPath.startsWith('/pengurus') ||
    currentPath.startsWith('/kepalaregu') ||
    currentPath.startsWith('/sinoman');

  if (isRestrictedPath) {
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
    if (currentPath.startsWith('/sinoman') && role !== 'ADMIN' && role !== 'SINOMAN' && role !== 'BENDAHARA') {
      return redirect('/krama/dashboard', 302);
    }
  }
  
  return next();
});
