import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  const accountList = [
    { email: 'krama@banjar.com', password: 'password123', phone: '081234567890' },
    { email: 'kepalaregu@banjar.com', password: 'password123', phone: '081234567891' },
    { email: 'pengurus@banjar.com', password: 'password123', phone: '081234567892' },
  ];

  const results = [];

  for (const item of accountList) {
    // 1. Registrasi via SDK resmi Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: item.email,
      password: item.password,
    });

    if (error) {
      results.push({ email: item.email, status: 'ERROR', message: error.message });
      continue;
    }

    if (data.user) {
      // 2. Hubungkan user_id baru ke tabel anggota
      await supabase
        .from('anggota')
        .update({ user_id: data.user.id })
        .eq('no_hp', item.phone);

      results.push({ email: item.email, status: 'SUCCESS', userId: data.user.id });
    }
  }

  return new Response(JSON.stringify({ message: 'Proses Seeding Selesai', results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};