import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { createSupabaseAdminClient } from '../../../lib/supabaseAdmin';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const identifier = formData.get('identifier')?.toString().trim() || '';
    const emailInput = formData.get('email')?.toString().trim().toLowerCase() || (identifier.includes('@') ? identifier.toLowerCase() : '');
    const phoneInput = formData.get('no_hp')?.toString().trim() || (identifier && !identifier.includes('@') ? identifier : '');
    const password = formData.get('password')?.toString() || '';
    let email = emailInput;

    if (emailInput) {
      const { data: matchingProfiles, error: matchingProfilesError } = await supabase
        .from('anggota')
        .select('user_id')
        .eq('email', emailInput)
        .limit(2);
      const emailColumnMissing = ['42703', 'PGRST204'].includes(matchingProfilesError?.code || '')
        && /email/i.test(matchingProfilesError?.message || '');
      if (matchingProfilesError && !emailColumnMissing) throw matchingProfilesError;
      if (!emailColumnMissing && matchingProfiles?.length && matchingProfiles.every((profile) => !profile.user_id)) {
        return redirect(`/login?error=${encodeURIComponent('Profil anggota ini belum memiliki akun login. Minta Admin membuat akun dengan mengisi email dan password pada form Edit Anggota.')}`, 303);
      }
    }

    if (!email && phoneInput) {
      const digits = phoneInput.replace(/\D/g, '');
      const phoneCandidates = new Set([phoneInput, digits]);

      if (digits.startsWith('0')) {
        phoneCandidates.add(digits.slice(1));
        phoneCandidates.add(`62${digits.slice(1)}`);
        phoneCandidates.add(`+62${digits.slice(1)}`);
      } else if (digits.startsWith('62')) {
        phoneCandidates.add(`0${digits.slice(2)}`);
        phoneCandidates.add(`+${digits}`);
      } else if (digits.startsWith('8')) {
        phoneCandidates.add(`0${digits}`);
        phoneCandidates.add(`62${digits}`);
        phoneCandidates.add(`+62${digits}`);
      }

      let { data: anggota, error: anggotaError } = await supabase
        .from('anggota')
        .select('email, no_hp, status_aktif, user_id')
        .in('no_hp', [...phoneCandidates]);

      const emailColumnMissing = ['42703', 'PGRST204'].includes(anggotaError?.code || '')
        && /email/i.test(anggotaError?.message || '');
      if (emailColumnMissing) {
        const fallback = await supabase
          .from('anggota')
          .select('no_hp, status_aktif, user_id')
          .in('no_hp', [...phoneCandidates]);
        anggota = fallback.data as typeof anggota;
        anggotaError = fallback.error;
      }

      if (anggotaError) throw anggotaError;
      if (!anggota?.length) {
        return redirect(`/login?error=${encodeURIComponent('Nomor HP tidak terdaftar dalam sistem.')}`, 303);
      }
      if (anggota.length > 1) {
        return redirect(`/login?error=${encodeURIComponent('Nomor HP tercatat lebih dari satu kali. Hubungi admin banjar.')}`, 303);
      }
      if (!anggota[0].user_id) {
        return redirect(`/login?error=${encodeURIComponent('Profil anggota ini belum memiliki akun login. Minta Admin membuat akun melalui form Edit Anggota.')}`, 303);
      }
      const storedPhoneDigits = anggota[0].no_hp?.replace(/\D/g, '') || digits;
      email = anggota[0].email?.trim().toLowerCase() || '';
      if (anggota[0].user_id && import.meta.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createSupabaseAdminClient();
        const { data: authAccount, error: authAccountError } = await supabaseAdmin.auth.admin.getUserById(anggota[0].user_id);
        if (authAccountError) throw authAccountError;
        email = authAccount.user?.email?.trim().toLowerCase() || email;
      }
      email ||= `${storedPhoneDigits}@banjar.local`;
    }

    if (!email || !password) {
      return redirect(`/login?error=${encodeURIComponent('Masukkan nomor HP atau email beserta password.')}`, 303);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      return redirect(`/login?error=${encodeURIComponent('Email/nomor HP atau password salah, atau akun Auth belum dibuat. Jika profil berasal dari impor nama saja, minta Admin membuat akun login terlebih dahulu.')}`, 303);
    }

    const { data: anggota, error: profileError } = await supabase
      .from('anggota')
      .select('role, status_aktif')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (profileError || !anggota) {
      return redirect(`/login?error=${encodeURIComponent('Profil akun tidak ditemukan. Minta admin menghubungkan akun dengan data krama.')}`, 303);
    }
    const cookieOptions = {
      path: '/',
      secure: new URL(request.url).protocol === 'https:',
      httpOnly: true,
      sameSite: 'lax' as const,
    };
    cookies.set('sb-access-token', data.session.access_token, {
      ...cookieOptions,
      maxAge: data.session.expires_in,
    });
    cookies.set('sb-refresh-token', data.session.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });

    const role = (anggota.role || 'KRAMA').toUpperCase().replace(/[\s_-]/g, '');

    let targetPath = '/krama/dashboard';
    if (role === 'ADMIN') {
      targetPath = '/admin/dashboard';
    } else if (role === 'PENGURUS') {
      targetPath = '/pengurus/dashboard';
    } else if (role === 'BENDAHARA') {
      targetPath = '/bendahara/verifikasi';
    } else if (role === 'KEPALAREGU' || role === 'KEPALAREGM' || role === 'KEPALAREGUTEMPEKAN') {
      targetPath = '/kepalaregu';
    }

    return redirect(targetPath, 302);
  } catch (err: any) {
    const message = typeof err?.message === 'string' ? err.message : 'Terjadi kesalahan server';
    return redirect(`/login?error=${encodeURIComponent(message)}`, 303);
  }
};