create or replace function public.admin_reverse_verified_setoran(
  p_setoran_id uuid,
  p_admin_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_keterangan text;
  v_admin_role text;
  v_admin_name text;
  v_payment_count integer;
begin
  select status_verifikasi, keterangan
    into v_status, v_keterangan
  from public.setoran_regu
  where id = p_setoran_id
  for update;

  if not found then
    raise exception 'Setoran tidak ditemukan.';
  end if;

  if upper(coalesce(v_status, '')) <> 'VERIFIED' then
    raise exception 'Hanya setoran VERIFIED yang dapat dibalik.';
  end if;

  select role, nama_lengkap
    into v_admin_role, v_admin_name
  from public.anggota
  where id = p_admin_id;

  if not found or upper(regexp_replace(coalesce(v_admin_role, ''), '[[:space:]_-]', '', 'g')) <> 'ADMIN' then
    raise exception 'Aksi pembalikan hanya dapat dilakukan oleh Admin.';
  end if;

  select count(*)::integer
    into v_payment_count
  from public.riwayat_pembayaran_cicilan
  where setoran_regu_id = p_setoran_id;

  if v_payment_count = 0 then
    raise exception 'Tidak ada pembayaran yang tertaut ke setoran ini.';
  end if;

  update public.setoran_regu
  set status_verifikasi = 'REJECTED',
      tanggal_verifikasi = now(),
      keterangan = concat_ws(
        E'\n',
        nullif(btrim(coalesce(v_keterangan, '')), ''),
        format('[PEMBALIKAN ADMIN] %s (%s), %s', coalesce(v_admin_name, 'Admin'), p_admin_id, to_char(now(), 'YYYY-MM-DD HH24:MI:SS TZ'))
      )
  where id = p_setoran_id;

  update public.tagihan_krama as tagihan
  set status_bayar = case
        when coalesce(tagihan.jumlah_dibayar, 0) >= coalesce(tagihan.total_nominal, tagihan.nominal, 0) then 'COLLECTED_BY_REGU'
        when coalesce(tagihan.jumlah_dibayar, 0) > 0 then 'PARTIAL'
        else 'BELUM_LUNAS'
      end,
      updated_at = now()
  where tagihan.id in (
    select distinct payment.tagihan_krama_id
    from public.riwayat_pembayaran_cicilan as payment
    where payment.setoran_regu_id = p_setoran_id
      and payment.tagihan_krama_id is not null
  );

  update public.riwayat_pembayaran_cicilan
  set setoran_regu_id = null
  where setoran_regu_id = p_setoran_id;

  return v_payment_count;
end;
$$;

revoke all on function public.admin_reverse_verified_setoran(uuid, uuid) from public;
revoke all on function public.admin_reverse_verified_setoran(uuid, uuid) from anon, authenticated;
grant execute on function public.admin_reverse_verified_setoran(uuid, uuid) to service_role;