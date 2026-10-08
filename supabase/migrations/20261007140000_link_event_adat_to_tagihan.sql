alter table public.tagihan_krama
  add column if not exists event_adat_id uuid references public.event_adat(id) on delete cascade;

create unique index if not exists tagihan_krama_event_adat_anggota_uidx
  on public.tagihan_krama (event_adat_id, anggota_id)
  where event_adat_id is not null;

insert into public.tagihan_krama (
  event_adat_id,
  anggota_id,
  total_nominal,
  nominal,
  jumlah_dibayar,
  status_bayar,
  tanggal_kejadian,
  keterangan
)
select
  event.id,
  anggota.id,
  event.tarif_default,
  event.tarif_default,
  0,
  'BELUM_LUNAS',
  event.tanggal_event,
  event.nama_event
from public.event_adat as event
join public.anggota as anggota
  on event.target_status_keanggotaan = 'SEMUA'
  or (event.target_status_keanggotaan = 'AKTIF' and coalesce(anggota.status_aktif, 'AKTIF') = 'AKTIF')
  or (event.target_status_keanggotaan = 'TIDAK_AKTIF' and anggota.status_aktif = 'TIDAK_AKTIF')
where not exists (
  select 1
  from public.tagihan_krama as existing
  where existing.event_adat_id = event.id
    and existing.anggota_id = anggota.id
);
